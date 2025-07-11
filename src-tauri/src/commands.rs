use crate::types::*;
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;
use chrono::Utc;

// Global state for recording sessions
pub type RecordingState = Mutex<RecordingSession>;

#[tauri::command]
pub async fn start_recording_session(
    state: State<'_, RecordingState>,
) -> Result<RecordingSession, String> {
    let mut session = state.lock().map_err(|e| e.to_string())?;
    
    session.status = RecordingStatus::Recording;
    session.start_time = Some(Utc::now().to_rfc3339());
    
    Ok(session.clone())
}

#[tauri::command]
pub async fn stop_recording_session(
    state: State<'_, RecordingState>,
) -> Result<RecordingSession, String> {
    let mut session = state.lock().map_err(|e| e.to_string())?;
    
    session.status = RecordingStatus::Processing;
    
    Ok(session.clone())
}

#[tauri::command]
pub async fn get_recording_status(
    state: State<'_, RecordingState>,
) -> Result<RecordingSession, String> {
    let session = state.lock().map_err(|e| e.to_string())?;
    Ok(session.clone())
}

#[tauri::command]
pub async fn process_recording_metadata(
    state: State<'_, RecordingState>,
    metadata: Value,
) -> Result<RecordingSession, String> {
    let mut session = state.lock().map_err(|e| e.to_string())?;
    
    // Parse metadata from frontend
    let recording_metadata: RecordingMetadata = serde_json::from_value(metadata)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;
    
    session.metadata = Some(recording_metadata);
    session.status = RecordingStatus::Completed;
    
    Ok(session.clone())
}

#[tauri::command]
pub async fn cleanup_recording_files(
    session_id: String,
) -> Result<String, String> {
    // Here we would implement file cleanup logic
    // For now, just return success
    Ok(format!("Cleaned up files for session: {}", session_id))
}