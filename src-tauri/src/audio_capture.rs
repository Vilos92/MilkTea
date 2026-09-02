//! Native system-audio capture.
//!
//! A cpal `Stream` is not `Send` on every backend, and managed Tauri state must be `Send + Sync`.
//! So a dedicated thread builds, owns and drops the stream, and the commands talk to it over
//! `std::sync::mpsc`. Captured frames reach the webview as raw interleaved `f32` on a Tauri IPC
//! channel. A JSON message on that same channel reports a terminal failure.
//!
//! Both commands are `async` so Tauri runs them off the main thread: opening a stream can block on
//! a macOS consent prompt for as long as the user takes to answer it.

use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::thread::JoinHandle;
use std::time::Duration;

#[cfg(any(target_os = "macos", target_os = "linux"))]
use cpal::traits::HostTrait;
use cpal::traits::{DeviceTrait, StreamTrait};
use cpal::{
    Device, FromSample, Host, InputCallbackInfo, Sample, SampleFormat, SizedSample, Stream,
    StreamConfig, SupportedStreamConfig,
};
use serde::Serialize;
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
/// macOS consent prompt blocks inside that call the first time an install captures system audio.
const START_TIMEOUT: Duration = Duration::from_secs(30);

/// ALSA PCM the PulseAudio and PipeWire bridges register. It records the sound server's default
/// source, which is what makes a sink monitor reachable from cpal at all.
#[cfg(target_os = "linux")]
const PULSE_BRIDGE_PCM: &str = "pulse";

/// ALSA's own default PCM, which routes through the same bridge on a desktop install.
#[cfg(target_os = "linux")]
const DEFAULT_PCM: &str = "default";

/*
 * Types.
 */

/// Format of the running capture, so the webview can build a matching audio graph.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemAudioStreamInfo {
    sample_rate: u32,
    channel_count: u16,
}

/// Terminal notice sent when a running stream dies on its own. The webview tells this apart from
/// PCM by its type: frames arrive as an `ArrayBuffer`, this arrives as an object.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemAudioFailure {
    message: String,
}

/// Handle to the thread that owns the running cpal stream.
struct CaptureSession {
    stop_tx: Sender<()>,
    thread: JoinHandle<()>,
}

/// Managed state holding at most one running capture.
#[derive(Default)]
pub struct AudioCaptureState {
    session: Mutex<Option<CaptureSession>>,
}

/// Shared by both cpal callbacks: reports a terminal failure and wakes the owning thread so it
/// drops the stream instead of holding the device (and the recording indicator) open.
#[derive(Clone)]
struct StreamMonitor {
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

/*
 * Commands.
 */

/// Opens the platform's system-audio source and streams interleaved `f32` frames over `channel`.
#[tauri::command(async)]
pub fn start_system_audio_capture(
    state: State<'_, AudioCaptureState>,
    channel: Channel<InvokeResponseBody>,
) -> Result<SystemAudioStreamInfo, String> {
    // Replacing a running capture keeps a reloaded webview from leaving an orphaned stream behind.
    stop_capture(&state)?;

    let (ready_tx, ready_rx) = mpsc::channel();
    let (stop_tx, stop_rx) = mpsc::channel();
    let thread_stop_tx = stop_tx.clone();
    let thread = std::thread::Builder::new()
        .name("milktea-system-audio".to_string())
        .spawn(move || run_capture(channel, thread_stop_tx, &ready_tx, &stop_rx))
        .map_err(|error| format!("Failed to start the capture thread: {error}"))?;

    match ready_rx.recv_timeout(START_TIMEOUT) {
        Ok(Ok(info)) => {
            let mut session = state.session.lock().map_err(|_| poisoned_state())?;
            *session = Some(CaptureSession { stop_tx, thread });
            Ok(info)
        }
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
            Err("Timed out opening the system audio stream".to_string())
        }
        Err(RecvTimeoutError::Disconnected) => {
            // The sender is only dropped once the thread returns, so this join is immediate.
            let _ = thread.join();
            Err("The capture thread stopped before the stream opened".to_string())
        }
    }
}

/// Stops the running capture, if any. Stopping when nothing runs is not an error.
#[tauri::command(async)]
pub fn stop_system_audio_capture(state: State<'_, AudioCaptureState>) -> Result<(), String> {
    stop_capture(&state)
}

/*
 * Helpers.
 */

/// Stops and reaps the current capture. Also called from the page-load hook, which is why it takes
/// the state directly rather than a command's `State` wrapper.
pub fn stop_capture(state: &AudioCaptureState) -> Result<(), String> {
    // Take the session before joining so the lock is never held across the thread join.
    let session = {
        let mut guard = state.session.lock().map_err(|_| poisoned_state())?;
        guard.take()
    };

    if let Some(CaptureSession { stop_tx, thread }) = session {
        // A closed receiver means the thread already exited. The join still reaps it.
        let _ = stop_tx.send(());
        let _ = thread.join();
    }

    Ok(())
}

fn poisoned_state() -> String {
    "The audio capture state is poisoned".to_string()
}

/// Owns the stream for its whole life: builds it, reports the outcome, then parks until stopped.
fn run_capture(
    channel: Channel<InvokeResponseBody>,
    stop_tx: Sender<()>,
    ready_tx: &Sender<Result<SystemAudioStreamInfo, String>>,
    stop_rx: &Receiver<()>,
) {
    let monitor = StreamMonitor {
        channel,
        abort_tx: stop_tx,
    };

    let stream = match open_stream(&monitor) {
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

fn open_stream(monitor: &StreamMonitor) -> Result<(Stream, SystemAudioStreamInfo), String> {
    let host = cpal::default_host();
    let device = find_capture_device(&host)?;
    let supported = capture_config(&device)?;

    let sample_format = supported.sample_format();
    let config: StreamConfig = supported.into();
    let info = SystemAudioStreamInfo {
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
    .map_err(|error| format!("Failed to open the system audio stream: {error}"))?;
    stream
        .play()
        .map_err(|error| format!("Failed to start the system audio stream: {error}"))?;

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
            config,
            move |samples: &[T], _: &InputCallbackInfo| sender.push(samples),
            move |error| error_monitor.fail(format!("System audio stream error: {error}")),
            None,
        )
        .map_err(|error| error.to_string())
}

/// Picks the device that carries the audio the user is hearing.
#[cfg(target_os = "macos")]
fn find_capture_device(host: &Host) -> Result<Device, String> {
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
fn find_capture_device(host: &Host) -> Result<Device, String> {
    // cpal enumerates ALSA PCM hints, and PulseAudio and PipeWire sink monitors are not hints, so
    // no enumerated name here ever contains "monitor". The sound server's bridge is a hint, and it
    // records whatever that server has set as the default source. Point the default source at a
    // sink monitor and this device carries system audio.
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
fn find_capture_device(_host: &Host) -> Result<Device, String> {
    Err(
        "System-audio capture is not implemented on this platform yet. Windows would need WASAPI \
         loopback support."
            .to_string(),
    )
}

/// Reads the format cpal will actually capture in, matching how it picks the input scope.
fn capture_config(device: &Device) -> Result<SupportedStreamConfig, String> {
    let config = if device.supports_input() {
        device.default_input_config()
    } else {
        device.default_output_config()
    };

    config.map_err(|error| format!("Failed to read the capture device config: {error}"))
}

impl StreamMonitor {
    /// Reports a terminal failure to the webview, then wakes the owning thread to drop the stream.
    fn fail(&self, message: String) {
        eprintln!("{message}");

        match serde_json::to_string(&SystemAudioFailure { message }) {
            Ok(json) => {
                let _ = self.channel.send(InvokeResponseBody::Json(json));
            }
            Err(error) => eprintln!("Failed to encode the system audio failure: {error}"),
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
            self.monitor
                .fail(format!("Failed to send a system audio chunk: {error}"));
        }
    }
}
