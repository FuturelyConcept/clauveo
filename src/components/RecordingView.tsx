import React, { useState, useRef, useCallback } from 'react'
import { Play, Square, Mic, MicOff, Monitor, AlertCircle } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { useRecording } from '../hooks/useRecording-simple'
import { processVideoFrames } from '../lib/videoProcessor'
import { generateAIResponse } from '../lib/aiClient'
import ProcessingView from './ProcessingView'
import ResultsView from './ResultsView'

interface RecordingViewProps {}

const RecordingView: React.FC<RecordingViewProps> = () => {
  const [viewState, setViewState] = useState<'setup' | 'recording' | 'processing' | 'results'>('setup')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const { session, startSession, stopSession } = useRecording()

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Start recording session in backend
      await startSession()
      
      // Get media stream
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: audioEnabled
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      // Set up MediaRecorder
      const options = { 
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      }
      const mediaRecorder = new MediaRecorder(mediaStream, options)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        recordedChunksRef.current = []
        
        // Start processing
        setViewState('processing')
        await processRecording(videoBlob)
      }
      
      // Start recording
      mediaRecorder.start()
      setViewState('recording')
      setCountdown(60)
      
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleStopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [audioEnabled, startSession])

  const handleStopRecording = useCallback(async () => {
    try {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      
      await stopSession()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
    }
  }, [stream, stopSession])

  const processRecording = async (videoBlob: Blob) => {
    try {
      setProcessingProgress(0)
      
      // Extract frames and generate metadata
      const metadata = await processVideoFrames(videoBlob, (progress) => {
        setProcessingProgress(progress * 0.8) // 80% for processing
      })
      
      // Generate AI response
      const aiResponse = await generateAIResponse(metadata)
      setProcessingProgress(1)
      
      // Save results
      setResults({ metadata, aiResponse })
      setViewState('results')
      
      // Cleanup video blob (privacy)
      URL.revokeObjectURL(URL.createObjectURL(videoBlob))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process recording')
      setViewState('setup')
    }
  }

  const handleTryAgain = () => {
    setViewState('setup')
    setResults(null)
    setError(null)
    setProcessingProgress(0)
  }

  if (viewState === 'processing') {
    return <ProcessingView progress={processingProgress} />
  }

  if (viewState === 'results' && results) {
    return <ResultsView results={results} onTryAgain={handleTryAgain} />
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-4xl">
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Show & Tell</h2>
            <p className="text-muted-foreground">
              Record your screen and voice to show the AI what you want to build or fix
            </p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
            </div>
          )}
          
          <div className="bg-black rounded-lg aspect-video mb-6 flex items-center justify-center border-2 border-border overflow-hidden">
            {stream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Your screen recording will appear here</p>
                <p className="text-sm">Click "Start Recording" to begin</p>
              </div>
            )}
          </div>
          
          {viewState === 'recording' && (
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {countdown}s
              </div>
              <div className="text-muted-foreground">
                Recording will auto-stop at 60 seconds
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4">
            {viewState === 'setup' && (
              <>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    audioEnabled 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>Audio</span>
                </button>
                
                <button
                  onClick={handleStartRecording}
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Recording</span>
                </button>
              </>
            )}
            
            {viewState === 'recording' && (
              <button
                onClick={handleStopRecording}
                className="flex items-center space-x-2 bg-destructive text-destructive-foreground px-8 py-3 rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
              >
                <Square className="h-5 w-5" />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
          
          {viewState === 'setup' && (
            <div className="mt-8 text-center">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">💡 <strong>Tips for best results:</strong></p>
                <ul className="text-left max-w-md mx-auto space-y-1">
                  <li>• Have your app ready to demonstrate</li>
                  <li>• Speak clearly while showing the issue</li>
                  <li>• Focus on specific bugs or features</li>
                  <li>• Keep it concise (60 seconds max)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecordingView