//! Native audio capture for both the system-audio and microphone sources.
//!
//! A cpal `Stream` is not `Send` on every backend, and managed Tauri state must be `Send + Sync`.
//! So a dedicated thread builds, owns and drops the stream, and the commands talk to it over
//! `std::sync::mpsc`. Captured frames reach the webview as raw interleaved `f32` on a Tauri IPC
//! channel. A JSON message on that same channel reports a terminal failure.
//!
//! One `CaptureSource` selects which device the thread opens: system audio taps the platform's
//! loopback or monitor device, and the microphone opens the host's default input device. Only one
//! capture runs at a time, and both sources share this single backend session. A monotonic start
//! token orders concurrent starts so the newest request always wins the install, even when an
//! older start opens its stream a moment later.
//!
//! The commands are `async` so Tauri runs them off the main thread: opening a stream can block on
//! a macOS consent prompt for as long as the user takes to answer it.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::thread::JoinHandle;
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{
    Device, FromSample, Host, InputCallbackInfo, Sample, SampleFormat, SizedSample, Stream,
    StreamConfig, SupportedStreamConfig,
};
use serde::{Deserialize, Serialize};
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::State;

/*
 * Constants.
 */

/// Frames buffered before a chunk goes out. Tauri evals raw channel payloads under 1 KiB into the
/// webview as a JSON number array and only takes the binary fetch path above that, so chunks are
/// sized to stay on the binary path while holding roughly 20 ms of stereo audio.
const CHUNK_FRAMES: usize = 1024;

/// How long a start request waits for the capture thread to open its stream. Generous because the
/// macOS consent prompt blocks inside that call the first time an install captures audio.
const START_TIMEOUT: Duration = Duration::from_secs(30);

/// Suffix PulseAudio appends to a sink name to form its monitor source.
#[cfg(target_os = "linux")]
const PULSE_MONITOR_SUFFIX: &str = ".monitor";

/// ALSA PCM the PulseAudio and PipeWire bridges register. It records the sound server's default
/// source, which is the only monitor route left when cpal falls back to its ALSA host.
#[cfg(target_os = "linux")]
const PULSE_BRIDGE_PCM: &str = "pulse";

/// ALSA's own default PCM, which routes through the same bridge on a desktop install.
#[cfg(target_os = "linux")]
const DEFAULT_PCM: &str = "default";

/*
 * Types.
 */

/// Which capture the webview asked for, so the thread opens the matching device.
#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CaptureSource {
    SystemAudio,
    Microphone,
}

/// Format of the running capture, so the webview can build a matching audio graph.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureStreamInfo {
    sample_rate: u32,
    channel_count: u16,
}

/// Terminal notice sent when a running stream dies on its own. The webview tells this apart from
/// PCM by its type: frames arrive as an `ArrayBuffer`, this arrives as an object.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureFailure {
    message: String,
}

/// Handle to the thread that owns the running cpal stream.
struct CaptureSession {
    /// Start token that installed this session, so a scoped stop only reaps its own capture.
    session_id: u64,
    stop_tx: Sender<()>,
    thread: JoinHandle<()>,
}

/// Managed state holding at most one running capture.
#[derive(Default)]
pub struct AudioCaptureState {
    session: Mutex<Option<CaptureSession>>,
    /// Highest start token that has begun. A start that opens behind a newer one abandons itself,
    /// so the newest source always wins the install even though every source shares this backend.
    latest_token: AtomicU64,
}

/// Shared by both cpal callbacks: reports a terminal failure and wakes the owning thread so it
/// drops the stream instead of holding the device (and the recording indicator) open.
#[derive(Clone)]
struct StreamMonitor {
    source: CaptureSource,
    channel: Channel<InvokeResponseBody>,
    abort_tx: Sender<()>,
}

/// Converts samples to `f32` and forwards them to the webview in fixed-size chunks.
struct ChunkSender {
    monitor: StreamMonitor,
    chunk_bytes: usize,
    pending: Vec<u8>,
    has_failed: bool,
}

impl CaptureSource {
    /// Human-readable name woven into error messages the webview surfaces.
    fn label(self) -> &'static str {
        match self {
            CaptureSource::SystemAudio => "system audio",
            CaptureSource::Microphone => "microphone",
        }
    }

    /// Distinct capture-thread name so each source is legible in a debugger or crash log.
    fn thread_name(self) -> &'static str {
        match self {
            CaptureSource::SystemAudio => "milktea-system-audio",
            CaptureSource::Microphone => "milktea-microphone",
        }
    }
}

/*
 * Commands.
 */

/// Opens the requested capture source and streams interleaved `f32` frames over `channel`.
///
/// `start_token` orders dispatches across every source so the newest request wins: a start that
/// opens its stream behind a newer one abandons itself instead of overwriting the live session.
#[tauri::command(async)]
pub fn start_audio_capture(
    state: State<'_, AudioCaptureState>,
    source: CaptureSource,
    channel: Channel<InvokeResponseBody>,
    start_token: u64,
) -> Result<CaptureStreamInfo, String> {
    // Record that this token has begun before opening the stream, so any older start still opening
    // sees a newer token and abandons rather than clobbering this one.
    state.latest_token.fetch_max(start_token, Ordering::SeqCst);

    let (ready_tx, ready_rx) = mpsc::channel();
    let (stop_tx, stop_rx) = mpsc::channel();
    let thread_stop_tx = stop_tx.clone();
    let thread = std::thread::Builder::new()
        .name(source.thread_name().to_string())
        .spawn(move || run_capture(source, channel, thread_stop_tx, &ready_tx, &stop_rx))
        .map_err(|error| format!("Failed to start the capture thread: {error}"))?;

    match ready_rx.recv_timeout(START_TIMEOUT) {
        Ok(Ok(info)) => install_session(&state, start_token, stop_tx, thread, info),
        Ok(Err(message)) => {
            let _ = thread.join();
            Err(message)
        }
        Err(RecvTimeoutError::Timeout) => {
            // Never join here: the thread may still be parked on a consent prompt. It self-cleans
            // once its ready report fails, and the stop signal covers the race where that report
            // landed just before this timeout fired.
            let _ = stop_tx.send(());
            drop(thread);
            Err(format!("Timed out opening the {} stream", source.label()))
        }
        Err(RecvTimeoutError::Disconnected) => {
            // The sender is only dropped once the thread returns, so this join is immediate.
            let _ = thread.join();
            Err("The capture thread stopped before the stream opened".to_string())
        }
    }
}

/// Stops the running capture. `session_id` scopes the stop to one session, so a stale start cannot
/// tear down a newer source. Passing `None` stops whatever runs, which the unload path relies on.
/// Stopping when nothing runs is not an error.
#[tauri::command(async)]
pub fn stop_audio_capture(
    state: State<'_, AudioCaptureState>,
    session_id: Option<u64>,
) -> Result<(), String> {
    stop_capture(&state, session_id)
}

/*
 * Helpers.
 */

/// Stops and reaps the current capture. Also called from the page-load hook, which is why it takes
/// the state directly rather than a command's `State` wrapper.
///
/// A `session_id` of `Some(id)` stops only when the current session was installed by that token,
/// so a stale start's stop no-ops against a newer source. `None` stops unconditionally.
pub fn stop_capture(state: &AudioCaptureState, session_id: Option<u64>) -> Result<(), String> {
    // Take the session before joining so the lock is never held across the thread join.
    let session = {
        let mut guard = state.session.lock().map_err(|_| poisoned_state())?;
        let matches_scope = match (guard.as_ref(), session_id) {
            (Some(current), Some(id)) => current.session_id == id,
            _ => true,
        };
        if matches_scope {
            guard.take()
        } else {
            None
        }
    };

    // An unscoped stop clears the whole session, so reset the token watermark. The webview restarts
    // its start counter from zero on reload and unmount, and the two must stay in step.
    if session_id.is_none() {
        state.latest_token.store(0, Ordering::SeqCst);
    }

    if let Some(CaptureSession {
        stop_tx, thread, ..
    }) = session
    {
        // A closed receiver means the thread already exited. The join still reaps it.
        let _ = stop_tx.send(());
        let _ = thread.join();
    }

    Ok(())
}

/// Installs a freshly opened capture as the current session, unless a newer start has begun.
fn install_session(
    state: &AudioCaptureState,
    start_token: u64,
    stop_tx: Sender<()>,
    thread: JoinHandle<()>,
    info: CaptureStreamInfo,
) -> Result<CaptureStreamInfo, String> {
    let previous = {
        let mut guard = state.session.lock().map_err(|_| poisoned_state())?;

        // Re-read under the lock: a newer start may have installed while this stream was opening,
        // and it must never be overwritten by this older one.
        if start_token < state.latest_token.load(Ordering::SeqCst) {
            drop(guard);
            // Abandon this stream. Signalling the thread drops it, and the join reaps it here.
            let _ = stop_tx.send(());
            let _ = thread.join();
            return Err("superseded by a newer capture request".to_string());
        }

        guard.replace(CaptureSession {
            session_id: start_token,
            stop_tx,
            thread,
        })
    };

    // Reap the replaced session outside the lock so the join never stalls another start.
    if let Some(CaptureSession {
        stop_tx, thread, ..
    }) = previous
    {
        let _ = stop_tx.send(());
        let _ = thread.join();
    }

    Ok(info)
}

fn poisoned_state() -> String {
    "The audio capture state is poisoned".to_string()
}

/// Owns the stream for its whole life: builds it, reports the outcome, then parks until stopped.
fn run_capture(
    source: CaptureSource,
    channel: Channel<InvokeResponseBody>,
    stop_tx: Sender<()>,
    ready_tx: &Sender<Result<CaptureStreamInfo, String>>,
    stop_rx: &Receiver<()>,
) {
    let monitor = StreamMonitor {
        source,
        channel,
        abort_tx: stop_tx,
    };

    let stream = match open_stream(source, &monitor) {
        Ok((stream, info)) => {
            if ready_tx.send(Ok(info)).is_err() {
                return;
            }
            stream
        }
        Err(message) => {
            let _ = ready_tx.send(Err(message));
            return;
        }
    };

    // Park until a stop command arrives, a callback aborts, or every sender is dropped, then drop
    // the stream here on the thread that created it.
    let _ = stop_rx.recv();
    drop(stream);
}

fn open_stream(
    source: CaptureSource,
    monitor: &StreamMonitor,
) -> Result<(Stream, CaptureStreamInfo), String> {
    let host = cpal::default_host();
    let device = find_capture_device(source, &host)?;
    let supported = capture_config(source, &device)?;

    let sample_format = supported.sample_format();
    let config: StreamConfig = supported.into();
    let info = CaptureStreamInfo {
        sample_rate: config.sample_rate,
        channel_count: config.channels,
    };
    let chunk_bytes = CHUNK_FRAMES * config.channels as usize * std::mem::size_of::<f32>();

    let stream = build_stream(
        &device,
        &config,
        sample_format,
        monitor.clone(),
        chunk_bytes,
    )
    .map_err(|error| format!("Failed to open the {} stream: {error}", source.label()))?;
    stream
        .play()
        .map_err(|error| format!("Failed to start the {} stream: {error}", source.label()))?;

    Ok((stream, info))
}

fn build_stream(
    device: &Device,
    config: &StreamConfig,
    sample_format: SampleFormat,
    monitor: StreamMonitor,
    chunk_bytes: usize,
) -> Result<Stream, String> {
    match sample_format {
        SampleFormat::I8 => build_typed_stream::<i8>(device, config, monitor, chunk_bytes),
        SampleFormat::I16 => build_typed_stream::<i16>(device, config, monitor, chunk_bytes),
        SampleFormat::I32 => build_typed_stream::<i32>(device, config, monitor, chunk_bytes),
        SampleFormat::U8 => build_typed_stream::<u8>(device, config, monitor, chunk_bytes),
        SampleFormat::U16 => build_typed_stream::<u16>(device, config, monitor, chunk_bytes),
        SampleFormat::U32 => build_typed_stream::<u32>(device, config, monitor, chunk_bytes),
        SampleFormat::F32 => build_typed_stream::<f32>(device, config, monitor, chunk_bytes),
        SampleFormat::F64 => build_typed_stream::<f64>(device, config, monitor, chunk_bytes),
        other => Err(format!("Unsupported sample format: {other}")),
    }
}

fn build_typed_stream<T>(
    device: &Device,
    config: &StreamConfig,
    monitor: StreamMonitor,
    chunk_bytes: usize,
) -> Result<Stream, String>
where
    T: SizedSample,
    f32: FromSample<T>,
{
    let error_monitor = monitor.clone();
    let mut sender = ChunkSender::new(monitor, chunk_bytes);

    device
        .build_input_stream(
            *config,
            move |samples: &[T], _: &InputCallbackInfo| sender.push(samples),
            move |error| {
                let label = error_monitor.source.label();
                error_monitor.fail(format!("{label} stream error: {error}"));
            },
            None,
        )
        .map_err(|error| error.to_string())
}

/// Picks the device the requested source captures from.
fn find_capture_device(source: CaptureSource, host: &Host) -> Result<Device, String> {
    match source {
        CaptureSource::SystemAudio => find_system_audio_device(host),
        // The default input works on every desktop OS through cpal, so the microphone needs no
        // platform branch and no duplex guard: opening a real input device is the point.
        CaptureSource::Microphone => host
            .default_input_device()
            .ok_or_else(|| "No default input device to capture".to_string()),
    }
}

/// Picks the device that carries the audio the user is hearing.
#[cfg(target_os = "macos")]
fn find_system_audio_device(host: &Host) -> Result<Device, String> {
    // Building an input stream on an output-only device makes cpal create a CoreAudio process tap
    // plus a private aggregate device, which is how macOS 14.6+ exposes system audio. cpal only
    // takes that path when the device reports no inputs of its own, so a duplex default output
    // (USB interface, aggregate, Bluetooth headset in HFP) would quietly record its microphone.
    let device = host
        .default_output_device()
        .ok_or_else(|| "No default output device to capture".to_string())?;

    if device.supports_input() {
        return Err(
            "The default output device also exposes inputs, so system-audio capture would \
                    record its microphone instead. Set a non-duplex output device as the system \
                    default and try again."
                .to_string(),
        );
    }

    Ok(device)
}

/// Picks the device that carries the audio the user is hearing.
#[cfg(target_os = "linux")]
fn find_system_audio_device(host: &Host) -> Result<Device, String> {
    // cpal prefers its native PulseAudio host on Linux, which lists sink monitors as ordinary
    // input devices, so system audio no longer needs the user to repoint their default source.
    // pipewire-pulse serves the same protocol on PipeWire desktops. The ALSA host only wins on
    // server-less installs, where the old bridge route is all there is.
    match host.id() {
        cpal::HostId::PulseAudio => find_pulseaudio_monitor(host),
        cpal::HostId::Alsa => find_alsa_bridge(host),
    }
}

/// Finds the monitor source of the default sink on a PulseAudio server, falling back to any
/// monitor source so capture still works when the default sink exposes none of its own.
#[cfg(target_os = "linux")]
fn find_pulseaudio_monitor(host: &Host) -> Result<Device, String> {
    // Matching runs on device ids, which carry the raw PulseAudio names (`<sink>.monitor`); the
    // descriptions are display strings like "Monitor of Built-in Audio" and are not stable.
    let default_monitor = host
        .default_output_device()
        .and_then(|device| device.id().ok())
        .map(|id| format!("{}{PULSE_MONITOR_SUFFIX}", id.id()));

    let devices = host
        .input_devices()
        .map_err(|error| format!("Failed to list input devices: {error}"))?;

    let mut fallback = None;
    for device in devices {
        let Ok(id) = device.id() else {
            continue;
        };
        let name = id.id();
        if Some(name) == default_monitor.as_deref() {
            return Ok(device);
        }
        if name.ends_with(PULSE_MONITOR_SUFFIX) && fallback.is_none() {
            fallback = Some(device);
        }
    }

    fallback.ok_or_else(|| "No sink monitor source found to capture system audio from.".to_string())
}

/// Last-resort route for installs without a sound server: the ALSA bridge PCM records whatever the
/// server-side default source is, so it only carries system audio once the user points that source
/// at a sink monitor.
#[cfg(target_os = "linux")]
fn find_alsa_bridge(host: &Host) -> Result<Device, String> {
    if let Some(device) = find_pcm(host, PULSE_BRIDGE_PCM)? {
        return Ok(device);
    }
    if let Some(device) = find_pcm(host, DEFAULT_PCM)? {
        return Ok(device);
    }

    Err(format!(
        "No `{PULSE_BRIDGE_PCM}` or `{DEFAULT_PCM}` ALSA input device found. System-audio capture \
         needs a PulseAudio or PipeWire sound server whose default source is a sink monitor \
         (`pactl set-default-source <sink>.monitor`)."
    ))
}

/// Finds an input device by ALSA PCM id, which cpal reports as the description's driver.
#[cfg(target_os = "linux")]
fn find_pcm(host: &Host, pcm: &str) -> Result<Option<Device>, String> {
    let mut devices = host
        .input_devices()
        .map_err(|error| format!("Failed to list input devices: {error}"))?;

    Ok(devices.find(|device| {
        device
            .description()
            .is_ok_and(|description| description.driver() == Some(pcm))
    }))
}

/// Picks the device that carries the audio the user is hearing.
#[cfg(not(any(target_os = "macos", target_os = "linux")))]
fn find_system_audio_device(_host: &Host) -> Result<Device, String> {
    Err(
        "System-audio capture is not implemented on this platform yet. Windows would need WASAPI \
         loopback support."
            .to_string(),
    )
}

/// Reads the format cpal will actually capture in, matching how it picks the input scope.
fn capture_config(source: CaptureSource, device: &Device) -> Result<SupportedStreamConfig, String> {
    let config = match source {
        // A real input device always exposes an input config.
        CaptureSource::Microphone => device.default_input_config(),
        // System audio may be an output-only device that cpal taps through its output scope.
        CaptureSource::SystemAudio => {
            if device.supports_input() {
                device.default_input_config()
            } else {
                device.default_output_config()
            }
        }
    };

    config.map_err(|error| format!("Failed to read the capture device config: {error}"))
}

impl StreamMonitor {
    /// Reports a terminal failure to the webview, then wakes the owning thread to drop the stream.
    fn fail(&self, message: String) {
        eprintln!("{message}");

        match serde_json::to_string(&CaptureFailure { message }) {
            Ok(json) => {
                let _ = self.channel.send(InvokeResponseBody::Json(json));
            }
            Err(error) => eprintln!("Failed to encode the capture failure: {error}"),
        }

        let _ = self.abort_tx.send(());
    }
}

impl ChunkSender {
    fn new(monitor: StreamMonitor, chunk_bytes: usize) -> Self {
        Self {
            monitor,
            chunk_bytes,
            pending: Vec::with_capacity(chunk_bytes),
            has_failed: false,
        }
    }

    fn push<T>(&mut self, samples: &[T])
    where
        T: Sample,
        f32: FromSample<T>,
    {
        if self.has_failed {
            return;
        }

        for sample in samples {
            // Native byte order: the webview reads these back as a `Float32Array` on this machine.
            self.pending
                .extend_from_slice(&(*sample).to_sample::<f32>().to_ne_bytes());

            if self.pending.len() >= self.chunk_bytes {
                self.flush();
            }
        }
    }

    fn flush(&mut self) {
        if self.pending.is_empty() {
            return;
        }

        let bytes = std::mem::replace(&mut self.pending, Vec::with_capacity(self.chunk_bytes));
        if let Err(error) = self.monitor.channel.send(InvokeResponseBody::Raw(bytes)) {
            // The webview can no longer receive frames, so tear the capture down rather than hold
            // the device open and leave the recording indicator lit.
            self.has_failed = true;
            let label = self.monitor.source.label();
            self.monitor
                .fail(format!("Failed to send a {label} chunk: {error}"));
        }
    }
}

/// Integration tests against a live sound server. They are ignored by default because they need a
/// running PipeWire or PulseAudio stack with a tone playing on the default sink — the audio-rig
/// container provides exactly that. Run them there with `cargo test -- --ignored`.
#[cfg(all(test, target_os = "linux"))]
mod live_capture_tests {
    use super::*;

    /// Loud enough to rule out noise, far above the pure digital silence a wrong-device capture
    /// yields against the rig's silent virtual microphone.
    const AUDIBLE_RMS_FLOOR: f64 = 0.01;
    const CAPTURE_TIME: Duration = Duration::from_secs(2);

    /// Opens an input stream on `device` and returns the RMS of two seconds of captured audio.
    fn captured_rms(device: &Device, supported: SupportedStreamConfig) -> f64 {
        use std::sync::Arc;

        let config: StreamConfig = supported.into();
        let samples: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
        let sink = samples.clone();

        assert_eq!(
            supported.sample_format(),
            SampleFormat::F32,
            "the rig's sound servers negotiate f32 capture"
        );
        let stream = device
            .build_input_stream(
                config,
                move |data: &[f32], _: &InputCallbackInfo| {
                    sink.lock().unwrap().extend_from_slice(data);
                },
                |error| panic!("stream error during capture: {error}"),
                None,
            )
            .expect("failed to build the capture stream");
        stream.play().expect("failed to start the capture stream");
        std::thread::sleep(CAPTURE_TIME);
        drop(stream);

        let captured = samples.lock().unwrap();
        assert!(!captured.is_empty(), "the stream delivered no samples");
        let sum_of_squares: f64 = captured.iter().map(|s| f64::from(*s) * f64::from(*s)).sum();
        (sum_of_squares / captured.len() as f64).sqrt()
    }

    #[test]
    #[ignore = "needs the audio-rig container's live sound server"]
    fn system_audio_captures_the_tone_playing_on_the_default_sink() {
        let host = cpal::default_host();
        let device = find_system_audio_device(&host).expect("no system-audio device found");
        let supported =
            capture_config(CaptureSource::SystemAudio, &device).expect("no capture config");

        let rms = captured_rms(&device, supported);
        assert!(
            rms > AUDIBLE_RMS_FLOOR,
            "system audio captured near-silence (rms {rms}); the sink monitor was not captured"
        );
    }

    #[test]
    #[ignore = "needs the audio-rig container's live sound server"]
    fn microphone_capture_opens_and_delivers_frames() {
        let host = cpal::default_host();
        let device = find_capture_device(CaptureSource::Microphone, &host)
            .expect("no microphone device found");
        let supported =
            capture_config(CaptureSource::Microphone, &device).expect("no capture config");

        // The rig's virtual microphone is silent, so only stream health is asserted here.
        captured_rms(&device, supported);
    }
}
