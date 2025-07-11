import { useState, useCallback } from 'react'

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
      
      // Create a simple session without Tauri for now
      const newSession: RecordingSession = {
        id: Math.random().toString(36).substring(7),
        status: 'Recording',
        start_time: new Date().toISOString()
      }
      
      setSession(newSession)
      console.log('Session started:', newSession)
      
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
      
      if (session) {
        const updatedSession = {
          ...session,
          status: 'Processing' as const
        }
        setSession(updatedSession)
        console.log('Session stopped:', updatedSession)
        return updatedSession
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording session'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const getStatus = useCallback(async () => {
    return session
  }, [session])

  const processMetadata = useCallback(async (metadata: any) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (session) {
        const processedSession = {
          ...session,
          status: 'Completed' as const,
          metadata
        }
        setSession(processedSession)
        console.log('Metadata processed:', processedSession)
        return processedSession
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process metadata'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const cleanupFiles = useCallback(async (sessionId: string) => {
    console.log('Cleanup files for session:', sessionId)
    return 'Files cleaned up (mock)'
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