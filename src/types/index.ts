export interface RecordingSession {
  id: string
  status: 'Idle' | 'Recording' | 'Processing' | 'Completed' | { Error: string }
  start_time?: string
  duration?: number
  metadata?: RecordingMetadata
}

export interface RecordingMetadata {
  session_id: string
  timestamp: string
  duration_seconds: number
  user_context: UserContext
  visual_context: VisualContext
  technical_context: TechnicalContext
}

export interface UserContext {
  transcript: string
  intent_keywords: string[]
  user_emotion: string
  request_type: string
}

export interface VisualContext {
  frames_analyzed: number
  ui_elements_detected: UiElement[]
  color_palette: string[]
  layout_analysis: string
  text_content: string[]
}

export interface UiElement {
  type: string
  text: string
  state: string
  timestamp: number
}

export interface TechnicalContext {
  detected_framework: string
  error_patterns: string[]
  suggested_focus: string[]
}

export interface AppSettings {
  openai_api_key: string
  claude_api_key: string
  default_recording_duration: number
  auto_delete_files: boolean
  show_advanced_settings: boolean
}