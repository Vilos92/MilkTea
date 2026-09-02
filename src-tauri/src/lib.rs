use tauri::webview::PageLoadEvent;
use tauri::Manager;

mod audio_capture;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(audio_capture::AudioCaptureState::default())
        .on_page_load(|webview, payload| {
            if payload.event() != PageLoadEvent::Started {
                return;
            }

            // A reload swaps the document out from under a running capture's IPC channel without
            // the Rust side noticing, which would leave the OS recording indicator lit. Stop on a
            // background thread so joining the capture thread never stalls page load.
            let handle = webview.app_handle().clone();
            std::thread::spawn(move || {
                let state = handle.state::<audio_capture::AudioCaptureState>();
                // Unscoped stop: a reload should tear down whatever capture is running.
                if let Err(error) = audio_capture::stop_capture(&state, None) {
                    eprintln!("Failed to stop audio capture on page load: {error}");
                }
            });
        })
        .invoke_handler(tauri::generate_handler![
            audio_capture::start_audio_capture,
            audio_capture::stop_audio_capture
        ])
        .run(tauri::generate_context!())
        .expect("error while running MilkTea");
}
