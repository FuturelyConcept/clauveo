import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface ClaudeCLIResponse {
  success: boolean
  response?: string
  error?: string
}

export const useClaudeCLI = () => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkInstallation()
  }, [])

  const checkInstallation = async () => {
    try {
      const installed = await invoke<boolean>('check_claude_cli_installed')
      setIsInstalled(installed)
    } catch (error) {
      console.error('Failed to check Claude CLI installation:', error)
      setIsInstalled(false)
    }
  }

  const sendToClaudeCLI = async (
    message: string,
    frames: string[] = [],
    transcript: string = '',
    projectPath?: string
  ): Promise<ClaudeCLIResponse> => {
    if (!isInstalled) {
      return {
        success: false,
        error: 'Claude CLI is not installed. Please install it from https://claude.ai/code'
      }
    }

    setIsLoading(true)
    
    try {
      const response = await invoke<string>('send_to_claude_cli', {
        message,
        frames,
        transcript,
        projectPath
      })

      return {
        success: true,
        response
      }
    } catch (error) {
      return {
        success: false,
        error: error as string
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isInstalled,
    isLoading,
    sendToClaudeCLI,
    checkInstallation
  }
}