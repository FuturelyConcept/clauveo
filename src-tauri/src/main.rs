// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod recording;
mod types;

use commands::*;
use types::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(RecordingState::new(RecordingSession::default()))
        .invoke_handler(tauri::generate_handler![
            start_recording_session,
            stop_recording_session,
            get_recording_status,
            process_recording_metadata,
            cleanup_recording_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}