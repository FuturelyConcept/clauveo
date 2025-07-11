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

export const extractKeyFrames = async (videoBlob: Blob): Promise<string[]> => {
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
      
      // Extract key frames: beginning, middle, and end
      const keyTimePoints = [
        0.1, // 0.1 seconds (beginning)
        video.duration * 0.5, // Middle
        video.duration * 0.9  // Near end
      ].filter(time => time < video.duration)
      
      console.log(`Extracting ${keyTimePoints.length} key frames from ${video.duration}s video`)
      
      let frameIndex = 0
      
      const captureKeyFrame = () => {
        if (frameIndex >= keyTimePoints.length) {
          URL.revokeObjectURL(video.src)
          console.log(`Extracted ${frames.length} key frames`)
          resolve(frames)
          return
        }
        
        const targetTime = keyTimePoints[frameIndex]
        video.currentTime = targetTime
        
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const frameData = canvas.toDataURL('image/jpeg', 0.9) // Higher quality
          frames.push(frameData)
          console.log(`Captured key frame ${frameIndex + 1} at ${targetTime.toFixed(1)}s`)
          frameIndex++
          
          // Use setTimeout to prevent blocking
          setTimeout(captureKeyFrame, 100)
        }
      }
      
      captureKeyFrame()
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
  })
}

// Keep the old function for backward compatibility
export const extractFrames = async (videoBlob: Blob, fps: number = 1): Promise<string[]> => {
  return extractKeyFrames(videoBlob) // Use key frames instead
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
      // Try multiple OCR approaches for better accuracy
      const ocrResults: string[] = []
      
      // Approach 1: Standard OCR with math symbols
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789+-*/=.,ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ?!()[]{}',
        tessedit_pageseg_mode: '6', // Single uniform block
        preserve_interword_spaces: '1'
      })
      const { data: { text: text1 } } = await worker.recognize(frames[i])
      ocrResults.push(text1.trim())
      
      // Approach 2: Numbers and symbols only
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789+-*/=?. ',
        tessedit_pageseg_mode: '8', // Treat as single word
        preserve_interword_spaces: '1'
      })
      const { data: { text: text2 } } = await worker.recognize(frames[i])
      ocrResults.push(text2.trim())
      
      // Approach 3: Line-by-line processing
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789+-*/=.,ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ?!',
        tessedit_pageseg_mode: '13', // Raw line, no word detection
        preserve_interword_spaces: '1'
      })
      const { data: { text: text3 } } = await worker.recognize(frames[i])
      ocrResults.push(text3.trim())
      
      // Choose the best result (longest non-empty text that contains math patterns)
      let bestText = ''
      for (const text of ocrResults) {
        if (text && (text.length > bestText.length || /\d+\s*[+\-*/=]\s*\d+/.test(text))) {
          bestText = text
        }
      }
      
      console.log(`OCR Frame ${i} approaches:`)
      console.log(`  Standard: "${ocrResults[0]}"`)
      console.log(`  Numbers: "${ocrResults[1]}"`)
      console.log(`  Lines: "${ocrResults[2]}"`)
      console.log(`  Best: "${bestText}"`)
      
      textResults.push(bestText)
      
      if (progressCallback) {
        progressCallback((i + 1) / framesToProcess.length)
      }
    } catch (error) {
      console.warn(`OCR failed for frame ${i}:`, error)
      textResults.push('')
    }
  }
  
  await worker.terminate()
  console.log('OCR Final Results:', textResults.filter(t => t.length > 0))
  return textResults
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Import the actual transcription function from aiClient
    const { transcribeAudio: aiTranscribe } = await import('./aiClient')
    console.log('Audio blob size:', audioBlob.size)
    const transcript = await aiTranscribe(audioBlob)
    console.log('Audio transcript:', transcript)
    return transcript
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
    // Extract key frames (20% of progress)
    progressCallback?.(0.1)
    const frames = await extractKeyFrames(videoBlob)
    progressCallback?.(0.2)
    
    // Analyze frames with vision API (40% of progress)
    const textResults: string[] = []
    const { analyzeFrameWithVision } = await import('./aiClient')
    const provider = (localStorage.getItem('ai_provider') as any) || 'gemini'
    
    console.log(`Analyzing ${frames.length} key frames with ${provider} vision API`)
    
    for (let i = 0; i < frames.length; i++) {
      try {
        const analysis = await analyzeFrameWithVision(frames[i], provider)
        textResults.push(analysis)
        console.log(`Frame ${i + 1} vision analysis:`, analysis.substring(0, 200) + '...')
        
        progressCallback?.(0.2 + ((i + 1) / frames.length) * 0.4)
      } catch (error) {
        console.warn(`Vision analysis failed for frame ${i}:`, error)
        textResults.push('')
      }
    }
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
    
    // Debug logging for metadata generation
    const combinedText = [transcript, ...textResults].join(' ')
    const keywords = extractKeywords(combinedText)
    const emotion = analyzeEmotion(transcript)
    const requestType = classifyRequest(combinedText) // Use both transcript AND OCR text
    const textContent = [...new Set(textResults.flatMap(text => 
      text.split(/\s+/).filter(word => word.length > 2)
    ))]
    
    console.log('Metadata generation debug:')
    console.log('- Transcript:', transcript)
    console.log('- Combined Text:', combinedText)
    console.log('- Keywords:', keywords)
    console.log('- Emotion:', emotion)
    console.log('- Request Type:', requestType)
    console.log('- Text Content:', textContent)
    
    const metadata: ProcessedMetadata = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      user_context: {
        transcript,
        intent_keywords: keywords,
        user_emotion: emotion,
        request_type: requestType
      },
      visual_context: {
        frames_analyzed: frames.length,
        ui_elements_detected: uiElements,
        color_palette: colorPalette,
        layout_analysis: 'web_application',
        text_content: textContent
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

export const exportForClaudeCode = async (
  videoBlob: Blob,
  progressCallback?: (progress: number) => void
): Promise<{frames: string[], transcript: string, instructions: string}> => {
  const sessionId = uuidv4()
  
  try {
    // Extract key frames
    progressCallback?.(0.1)
    const frames = await extractKeyFrames(videoBlob)
    progressCallback?.(0.5)
    
    // Extract audio and transcribe (if OpenAI is available)
    let transcript = 'Audio transcription not available'
    try {
      const audioBlob = await extractAudioBlob(videoBlob)
      transcript = await transcribeAudio(audioBlob)
    } catch (error) {
      console.log('Audio transcription skipped:', error)
    }
    progressCallback?.(0.9)
    
    // Generate instructions for Claude Code
    const instructions = `I recorded a ${Math.round(videoBlob.size / 1024)}KB video. Here's what I captured:

**Audio Transcript:**
"${transcript}"

**Key Frames:**
I'm attaching ${frames.length} key frames from the recording that show the relevant content.

**Request:**
Please analyze these images and my audio description to help me with what I was showing. Pay attention to any text, code, mathematical expressions, or UI elements visible in the screenshots.`

    progressCallback?.(1.0)
    
    return {
      frames,
      transcript,
      instructions
    }
    
  } catch (error) {
    console.error('Error exporting for Claude Code:', error)
    throw error
  }
}

export const downloadFramesAndTranscript = async (frames: string[], transcript: string, instructions: string) => {
  const sessionId = uuidv4()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  // Download transcript and instructions as text file
  const textContent = `${instructions}\n\n--- Raw Transcript ---\n${transcript}`
  const textBlob = new Blob([textContent], { type: 'text/plain' })
  const textUrl = URL.createObjectURL(textBlob)
  
  const textLink = document.createElement('a')
  textLink.href = textUrl
  textLink.download = `clauveo-session-${timestamp}.txt`
  document.body.appendChild(textLink)
  textLink.click()
  document.body.removeChild(textLink)
  URL.revokeObjectURL(textUrl)
  
  // Download each frame as image
  frames.forEach((frameData, index) => {
    const link = document.createElement('a')
    link.href = frameData
    link.download = `clauveo-frame-${index + 1}-${timestamp}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
  
  console.log(`Downloaded ${frames.length} frames and transcript for Claude Code analysis`)
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
  // Check for math calculations first (highest priority)
  if (/\d+\s*[+\-*/=]\s*\d+/i.test(text) || /\b(calculate|math|multiply|divide|add|subtract|equals|answer)\b/i.test(text)) return 'calculation'
  
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