import React, { useState, useRef, useCallback } from 'react'
import { Video, Square, Loader2 } from 'lucide-react'
import { exportForClaudeCode } from '../lib/videoProcessor'

interface VideoRecorderProps {
  onRecordingComplete: (data: {
    frames: string[]
    transcript: string
    instructions: string
  }) => void
  onRecordingError: (error: string) => void
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onRecordingComplete, 
  onRecordingError 
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startVideoRecording = useCallback(async () => {
    try {
      setIsRecording(true)
      
      // Try different media capture options for better WSL compatibility
      let stream: MediaStream
      
      try {
        // First try with screen + audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        })
      } catch (error) {
        console.warn('Screen + audio failed, trying video only:', error)
        try {
          // Fallback to video only
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              mediaSource: 'screen',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          })
        } catch (error2) {
          console.warn('Screen capture failed, trying simplified options:', error2)
          // Final fallback - minimal constraints
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          })
        }
      }
      
      streamRef.current = stream
      chunksRef.current = []
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        await handleRecordingComplete()
      }
      
      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      
      // Start countdown
      setCountdown(3)
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      onRecordingError('Failed to start recording. Please check your permissions.')
      setIsRecording(false)
    }
  }, [onRecordingError])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setIsRecording(false)
  }, [])

  const handleRecordingComplete = useCallback(async () => {
    try {
      setIsProcessing(true)
      setProcessingProgress(0)
      
      // Create video blob from chunks
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
      
      if (!videoBlob || videoBlob.size === 0) {
        throw new Error('No video data captured')
      }

      // Process video for Claude Code
      const exportData = await exportForClaudeCode(videoBlob, (progress) => {
        setProcessingProgress(progress)
      })

      // Call completion handler
      onRecordingComplete(exportData)
      
    } catch (error) {
      console.error('Failed to process recording:', error)
      onRecordingError('Failed to process recording. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [onRecordingComplete, onRecordingError])


  if (isProcessing) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Processing... {Math.round(processingProgress * 100)}%</span>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-2">
        {countdown > 0 && (
          <div className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm font-bold">
            {countdown}
          </div>
        )}
        <button
          onClick={stopVideoRecording}
          className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Square className="h-4 w-4" />
          <span className="text-sm">Stop Recording</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startVideoRecording}
      className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
      title="Record screen and audio"
    >
      <Video className="h-5 w-5" />
    </button>
  )
}

export default VideoRecorder