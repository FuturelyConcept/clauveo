import { createWorker } from 'tesseract.js'
import { v4 as uuidv4 } from 'uuid'

export interface ProcessedMetadata {
  session_id: string
  timestamp: string
  duration_seconds: number
  user_context: {
    transcript: string
    intent_keywords: string[]
    user_emotion: string
    request_type: string
  }
  visual_context: {
    frames_analyzed: number
    ui_elements_detected: Array<{
      type: string
      text: string
      state: string
      timestamp: number
    }>
    color_palette: string[]
    layout_analysis: string
    text_content: string[]
  }
  technical_context: {
    detected_framework: string
    error_patterns: string[]
    suggested_focus: string[]
  }
}

export const extractFrames = async (videoBlob: Blob, fps: number = 1): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    video.src = URL.createObjectURL(videoBlob)
    video.muted = true
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const frames: string[] = []
      const interval = 1 / fps
      let currentTime = 0
      
      const captureFrame = () => {
        if (currentTime >= video.duration) {
          URL.revokeObjectURL(video.src)
          resolve(frames)
          return
        }
        
        video.currentTime = currentTime
        
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          frames.push(canvas.toDataURL('image/jpeg', 0.8))
          currentTime += interval
          
          // Use setTimeout to prevent blocking
          setTimeout(captureFrame, 10)
        }
      }
      
      captureFrame()
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
  })
}

export const extractAudioBlob = async (videoBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    video.src = URL.createObjectURL(videoBlob)
    video.muted = true
    
    video.onloadedmetadata = async () => {
      try {
        const source = audioContext.createMediaElementSource(video)
        const destination = audioContext.createMediaStreamDestination()
        source.connect(destination)
        
        const mediaRecorder = new MediaRecorder(destination.stream)
        const chunks: Blob[] = []
        
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' })
          URL.revokeObjectURL(video.src)
          resolve(audioBlob)
        }
        
        mediaRecorder.start()
        video.play()
        
        video.onended = () => {
          mediaRecorder.stop()
        }
      } catch (error) {
        URL.revokeObjectURL(video.src)
        reject(error)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
  })
}

export const performOCR = async (frames: string[], progressCallback?: (progress: number) => void): Promise<string[]> => {
  const worker = await createWorker('eng', 1, {
    logger: (m) => console.log(`OCR: ${m.status} - ${m.progress}`)
  })
  
  const textResults: string[] = []
  
  // Limit to first 10 frames for faster testing
  const framesToProcess = frames.slice(0, Math.min(10, frames.length))
  
  for (let i = 0; i < framesToProcess.length; i++) {
    try {
      const { data: { text } } = await worker.recognize(frames[i])
      textResults.push(text.trim())
      
      if (progressCallback) {
        progressCallback((i + 1) / framesToProcess.length)
      }
    } catch (error) {
      console.warn(`OCR failed for frame ${i}:`, error)
      textResults.push('')
    }
  }
  
  await worker.terminate()
  return textResults
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // This would integrate with OpenAI Whisper
    // For now, return a meaningful placeholder
    console.log('Audio blob size:', audioBlob.size)
    return "User is explaining a bug in their application and needs help fixing it"
  } catch (error) {
    console.error('Audio transcription failed:', error)
    return "Audio transcription not available"
  }
}

export const analyzeUIElements = (frames: string[], textResults: string[]): Array<{
  type: string
  text: string
  state: string
  timestamp: number
}> => {
  const elements: Array<{
    type: string
    text: string
    state: string
    timestamp: number
  }> = []
  
  textResults.forEach((text, index) => {
    const words = text.toLowerCase().split(/\s+/)
    const timestamp = index // Assuming 1fps, so frame index = second
    
    // Detect common UI elements
    if (words.includes('button') || words.includes('click')) {
      elements.push({
        type: 'button',
        text: text,
        state: 'clickable',
        timestamp
      })
    }
    
    if (words.includes('error') || words.includes('warning')) {
      elements.push({
        type: 'error_message',
        text: text,
        state: 'visible',
        timestamp
      })
    }
    
    if (words.includes('form') || words.includes('input')) {
      elements.push({
        type: 'form',
        text: text,
        state: 'editable',
        timestamp
      })
    }
  })
  
  return elements
}

export const detectFramework = (textResults: string[]): string => {
  const allText = textResults.join(' ').toLowerCase()
  
  if (allText.includes('react') || allText.includes('jsx')) return 'react'
  if (allText.includes('vue') || allText.includes('vuejs')) return 'vue'
  if (allText.includes('angular')) return 'angular'
  if (allText.includes('svelte')) return 'svelte'
  if (allText.includes('next') || allText.includes('nextjs')) return 'nextjs'
  
  return 'unknown'
}

export const extractColors = (frames: string[]): string[] => {
  // This would analyze dominant colors in frames
  // For now, return common web colors
  return ['#ffffff', '#000000', '#007bff', '#28a745', '#dc3545', '#ffc107']
}

export const processVideoFrames = async (
  videoBlob: Blob,
  progressCallback?: (progress: number) => void
): Promise<ProcessedMetadata> => {
  const sessionId = uuidv4()
  const startTime = Date.now()
  
  try {
    // Extract frames (20% of progress)
    progressCallback?.(0.1)
    const frames = await extractFrames(videoBlob, 0.5) // 1 frame every 2 seconds for faster processing
    progressCallback?.(0.2)
    
    // Perform OCR (40% of progress)
    const textResults = await performOCR(frames, (ocrProgress) => {
      progressCallback?.(0.2 + (ocrProgress * 0.4))
    })
    progressCallback?.(0.6)
    
    // Extract audio and transcribe (20% of progress)
    const audioBlob = await extractAudioBlob(videoBlob)
    const transcript = await transcribeAudio(audioBlob)
    progressCallback?.(0.8)
    
    // Analyze and build metadata (20% of progress)
    const uiElements = analyzeUIElements(frames, textResults)
    const detectedFramework = detectFramework(textResults)
    const colorPalette = extractColors(frames)
    
    progressCallback?.(0.9)
    
    const metadata: ProcessedMetadata = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      user_context: {
        transcript,
        intent_keywords: extractKeywords(transcript),
        user_emotion: analyzeEmotion(transcript),
        request_type: classifyRequest(transcript)
      },
      visual_context: {
        frames_analyzed: frames.length,
        ui_elements_detected: uiElements,
        color_palette: colorPalette,
        layout_analysis: 'web_application',
        text_content: [...new Set(textResults.flatMap(text => 
          text.split(/\s+/).filter(word => word.length > 2)
        ))]
      },
      technical_context: {
        detected_framework: detectedFramework,
        error_patterns: detectErrorPatterns(textResults, transcript),
        suggested_focus: generateSuggestedFocus(uiElements, transcript)
      }
    }
    
    progressCallback?.(1.0)
    return metadata
    
  } catch (error) {
    console.error('Error processing video:', error)
    throw error
  }
}

const extractKeywords = (text: string): string[] => {
  const keywords = text.toLowerCase().match(/\b(bug|error|fix|issue|problem|feature|enhancement|add|create|update|delete|improve)\b/g)
  return [...new Set(keywords || [])]
}

const analyzeEmotion = (text: string): string => {
  const frustrated = /\b(frustrated|annoyed|stuck|broken|not working|failing)\b/i.test(text)
  const excited = /\b(excited|great|awesome|love|amazing)\b/i.test(text)
  const confused = /\b(confused|unclear|don't understand|not sure)\b/i.test(text)
  
  if (frustrated) return 'frustrated'
  if (excited) return 'excited'
  if (confused) return 'confused'
  return 'neutral'
}

const classifyRequest = (text: string): string => {
  if (/\b(bug|error|issue|problem|fix|broken|not working)\b/i.test(text)) return 'bug_fix'
  if (/\b(feature|add|create|new|enhancement|improve)\b/i.test(text)) return 'feature_request'
  if (/\b(refactor|optimize|clean|improve|better)\b/i.test(text)) return 'refactoring'
  if (/\b(question|help|how|what|why)\b/i.test(text)) return 'question'
  return 'general'
}

const detectErrorPatterns = (textResults: string[], transcript: string): string[] => {
  const patterns: string[] = []
  const allText = [...textResults, transcript].join(' ').toLowerCase()
  
  if (allText.includes('undefined') || allText.includes('null')) {
    patterns.push('undefined_null_reference')
  }
  if (allText.includes('404') || allText.includes('not found')) {
    patterns.push('missing_resource')
  }
  if (allText.includes('validation') || allText.includes('required')) {
    patterns.push('validation_error')
  }
  if (allText.includes('login') || allText.includes('authentication')) {
    patterns.push('authentication_issue')
  }
  if (allText.includes('cors') || allText.includes('cross-origin')) {
    patterns.push('cors_issue')
  }
  
  return patterns
}

const generateSuggestedFocus = (uiElements: any[], transcript: string): string[] => {
  const focus: string[] = []
  
  if (uiElements.some(el => el.type === 'form')) {
    focus.push('form_handling')
  }
  if (uiElements.some(el => el.type === 'button')) {
    focus.push('event_handling')
  }
  if (uiElements.some(el => el.type === 'error_message')) {
    focus.push('error_handling')
  }
  if (transcript.toLowerCase().includes('api')) {
    focus.push('api_integration')
  }
  if (transcript.toLowerCase().includes('style') || transcript.toLowerCase().includes('css')) {
    focus.push('styling')
  }
  
  return focus
}