use crate::types::*;
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;
use chrono::Utc;
use std::process::Command;
use std::fs;
use uuid::Uuid;
use base64::Engine;

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

#[tauri::command]
pub async fn send_to_claude_cli(
    message: String,
    frames: Vec<String>, // base64 encoded images
    transcript: String,
    project_path: Option<String>
) -> Result<String, String> {
    // Create temporary directory for this session
    let temp_dir = std::env::temp_dir().join(format!("clauveo_{}", Uuid::new_v4()));
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp directory: {}", e))?;

    // Save frames as image files
    let mut frame_paths = Vec::new();
    for (i, frame_data) in frames.iter().enumerate() {
        let frame_path = temp_dir.join(format!("frame_{}.jpg", i + 1));
        
        // Remove base64 prefix if present
        let image_data = if frame_data.starts_with("data:image") {
            frame_data.split(',').nth(1).unwrap_or(frame_data)
        } else {
            frame_data
        };
        
        // Decode base64 and save as file
        match base64::engine::general_purpose::STANDARD.decode(image_data) {
            Ok(bytes) => {
                if let Err(e) = fs::write(&frame_path, bytes) {
                    eprintln!("Failed to save frame {}: {}", i + 1, e);
                    continue;
                }
                frame_paths.push(frame_path);
            }
            Err(e) => {
                eprintln!("Failed to decode frame {}: {}", i + 1, e);
                continue;
            }
        }
    }

    // Create message with context
    let full_message = if !transcript.is_empty() {
        format!("{}\n\nAudio transcript: \"{}\"\n\nI'm attaching {} screenshots that show what I was working on.", 
                message, transcript, frame_paths.len())
    } else {
        format!("{}\n\nI'm attaching {} screenshots that show what I was working on.", 
                message, frame_paths.len())
    };

    // Build Claude CLI command with proper environment
    let mut claude_cmd = if cfg!(target_os = "windows") {
        // On Windows, use WSL2 to run Claude CLI
        let mut cmd = Command::new("wsl");
        cmd.arg("claude");
        cmd
    } else {
        // On Linux/macOS, run directly
        let mut cmd = Command::new("claude");
        cmd.env("PATH", format!("{}:/home/manojuikey/.npm-global/bin", 
            std::env::var("PATH").unwrap_or_default()));
        cmd
    };
    claude_cmd.arg("chat");
    claude_cmd.arg(&full_message);

    // Add frame attachments
    for frame_path in &frame_paths {
        claude_cmd.arg("--attach").arg(frame_path);
    }

    // Set project path if provided
    if let Some(path) = project_path {
        claude_cmd.current_dir(&path);
    }

    // Execute Claude CLI command
    let output = claude_cmd.output()
        .map_err(|e| format!("Failed to execute Claude CLI: {}. Make sure Claude CLI is installed and in PATH.", e))?;

    // Cleanup temporary files
    let _ = fs::remove_dir_all(&temp_dir);

    if output.status.success() {
        let response = String::from_utf8_lossy(&output.stdout);
        Ok(response.to_string())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Claude CLI error: {}", error))
    }
}

#[tauri::command]
pub fn check_claude_cli_installed() -> bool {
    let result = if cfg!(target_os = "windows") {
        // On Windows, check if Claude CLI is available in WSL2
        Command::new("wsl")
            .arg("claude")
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    } else {
        // On Linux/macOS, check directly
        let mut cmd = Command::new("claude");
        cmd.env("PATH", format!("{}:/home/manojuikey/.npm-global/bin", 
            std::env::var("PATH").unwrap_or_default()));
        cmd.arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    };
    
    result
}