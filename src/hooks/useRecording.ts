import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface RecordingSession {
  id: string
  status: 'Idle' | 'Recording' | 'Processing' | 'Completed' | { Error: string }
  start_time?: string
  duration?: number
  metadata?: any
}

export const useRecording = () => {
  const [session, setSession] = useState<RecordingSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const newSession = await invoke<RecordingSession>('start_recording_session')
      setSession(newSession)
      
      return newSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording session'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedSession = await invoke<RecordingSession>('stop_recording_session')
      setSession(updatedSession)
      
      return updatedSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording session'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const currentSession = await invoke<RecordingSession>('get_recording_status')
      setSession(currentSession)
      
      return currentSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recording status'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const processMetadata = useCallback(async (metadata: any) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const processedSession = await invoke<RecordingSession>('process_recording_metadata', { metadata })
      setSession(processedSession)
      
      return processedSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process metadata'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cleanupFiles = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await invoke<string>('cleanup_recording_files', { sessionId })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup files'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    session,
    isLoading,
    error,
    startSession,
    stopSession,
    getStatus,
    processMetadata,
    cleanupFiles
  }
}