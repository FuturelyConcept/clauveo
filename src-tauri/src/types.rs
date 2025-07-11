use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingSession {
    pub id: String,
    pub status: RecordingStatus,
    pub start_time: Option<String>,
    pub duration: Option<u64>,
    pub metadata: Option<RecordingMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecordingStatus {
    Idle,
    Recording,
    Processing,
    Completed,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingMetadata {
    pub session_id: String,
    pub timestamp: String,
    pub duration_seconds: u64,
    pub user_context: UserContext,
    pub visual_context: VisualContext,
    pub technical_context: TechnicalContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub transcript: String,
    pub intent_keywords: Vec<String>,
    pub user_emotion: String,
    pub request_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualContext {
    pub frames_analyzed: u32,
    pub ui_elements_detected: Vec<UiElement>,
    pub color_palette: Vec<String>,
    pub layout_analysis: String,
    pub text_content: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiElement {
    pub element_type: String,
    pub text: String,
    pub state: String,
    pub timestamp: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechnicalContext {
    pub detected_framework: String,
    pub error_patterns: Vec<String>,
    pub suggested_focus: Vec<String>,
}

impl Default for RecordingSession {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            status: RecordingStatus::Idle,
            start_time: None,
            duration: None,
            metadata: None,
        }
    }
}