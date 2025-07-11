import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle,
  Plus,
  Play,
  Edit3,
  Trash2,
  Shield,
  GitCommit,
  TestTube,
  Terminal,
  Video,
  Mic,
  Send,
  ChevronDown,
  Paperclip,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import VideoRecorder from './VideoRecorder'
import { useClaudeCLI } from '../hooks/useClaudeCLI'

type View = 'home' | 'agents' | 'projects' | 'session'

interface Agent {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  created: string
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'image' | 'video'
    url: string
    name: string
  }[]
}

const ClauveoInterface: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [projectPath, setProjectPath] = useState('/Users/mufeedvh/dev/actix-blog')
  const [pendingAttachments, setPendingAttachments] = useState<{
    type: 'video' | 'audio'
    frames?: string[]
    transcript?: string
    instructions?: string
  }[]>([])
  
  const { isInstalled, isLoading, sendToClaudeCLI } = useClaudeCLI()

  const agents: Agent[] = [
    {
      id: 'unit-tests',
      name: 'Unit Tests Bot',
      icon: <TestTube className="h-6 w-6" />,
      description: 'Create and run unit tests',
      created: '6/18/2025'
    },
    {
      id: 'security',
      name: 'Security Scanner',
      icon: <Shield className="h-6 w-6" />,
      description: 'Scan for security vulnerabilities',
      created: '6/18/2025'
    },
    {
      id: 'git-commit',
      name: 'Git Commit Bot',
      icon: <GitCommit className="h-6 w-6" />,
      description: 'Generate commit messages',
      created: '6/18/2025'
    }
  ]

  const handleSendMessage = async () => {
    if (!inputText.trim() && pendingAttachments.length === 0) return

    let messageContent = inputText

    // If we have video attachments, format the message for Claude CLI
    const videoAttachment = pendingAttachments.find(a => a.type === 'video')
    if (videoAttachment && videoAttachment.instructions) {
      messageContent = videoAttachment.instructions + (inputText ? `\n\nAdditional context: ${inputText}` : '')
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: pendingAttachments.map(att => ({
        type: att.type === 'video' ? 'video' : 'image',
        url: '', // Will be handled by Claude CLI
        name: att.type === 'video' ? `${att.frames?.length || 0} frames + transcript` : 'audio'
      }))
    }

    setMessages(prev => [...prev, newMessage])
    setInputText('')
    const attachments = [...pendingAttachments]
    setPendingAttachments([])
    
    // Send to Claude CLI
    try {
      const result = await sendToClaudeCLI(
        messageContent,
        videoAttachment?.frames || [],
        videoAttachment?.transcript || '',
        projectPath
      )

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.success 
          ? result.response || 'No response received'
          : `Error: ${result.error}`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, responseMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Failed to communicate with Claude CLI: ${error}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleVideoRecordingComplete = (data: {
    frames: string[]
    transcript: string
    instructions: string
  }) => {
    setPendingAttachments(prev => [...prev, {
      type: 'video',
      frames: data.frames,
      transcript: data.transcript,
      instructions: data.instructions
    }])
  }

  const handleVideoRecordingError = (error: string) => {
    // Show error to user
    console.error('Video recording error:', error)
    // TODO: Add toast notification
  }

  // Top Navigation Bar
  const TopBar = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-white font-medium">Claude Code 1.0.27</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 text-gray-300 hover:text-white text-sm">
          <BarChart3 className="h-4 w-4" />
          <span>Usage Dashboard</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-300 hover:text-white text-sm">
          <FileText className="h-4 w-4" />
          <span>CLAUDE.md</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-300 hover:text-white text-sm">
          <span>MCP</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-300 hover:text-white text-sm">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
        <button className="text-gray-300 hover:text-white">
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  // Home View
  const HomeView = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">🌙</div>
        <h1 className="text-3xl font-semibold text-white mb-2">Welcome to Clauveo</h1>
        <p className="text-gray-400">Privacy-first AI coding assistant with video recording</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <button
          onClick={() => setCurrentView('agents')}
          className="flex flex-col items-center p-8 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <GitCommit className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-white">AI Agents</h3>
          <p className="text-sm text-gray-400 mt-1">Manage your AI coding agents</p>
        </button>
        
        <button
          onClick={() => setCurrentView('projects')}
          className="flex flex-col items-center p-8 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-white">Projects</h3>
          <p className="text-sm text-gray-400 mt-1">Manage your coding projects</p>
        </button>
      </div>
    </div>
  )

  // Agents View
  const AgentsView = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('home')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Agents</h2>
            <p className="text-sm text-gray-400">Manage your AI coding agents</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100">
          <Plus className="h-4 w-4" />
          <span>Create AI Agent</span>
        </button>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-800">
        <button className="px-4 py-2 text-white border-b-2 border-white">
          Agents
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-white">
          Running Sessions
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-300">
                {agent.icon}
              </div>
            </div>
            <h3 className="text-lg font-medium text-white text-center mb-2">{agent.name}</h3>
            <p className="text-xs text-gray-400 text-center mb-4">Created: {agent.created}</p>
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => {
                  setSelectedAgent(agent.id)
                  setCurrentView('session')
                }}
                className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm"
              >
                <Play className="h-3 w-3" />
                <span>Execute</span>
              </button>
              <button className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm">
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm">
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Session View
  const SessionView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('agents')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Terminal className="h-5 w-5 text-white" />
          <div>
            <h2 className="text-lg font-semibold text-white">Clauveo AI Session</h2>
            <p className="text-sm text-gray-400">Interactive AI coding session</p>
          </div>
        </div>
      </div>

      {/* Project Path */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Project Path</span>
            <div className="text-white font-mono text-sm">{projectPath}</div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Claude CLI Installation Warning */}
        {isInstalled === false && (
          <div className="mb-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-orange-300 font-medium mb-1">Claude CLI Not Installed</h4>
                <p className="text-orange-200 text-sm mb-3">
                  To get AI responses, you need to install Claude CLI first.
                </p>
                <button
                  onClick={() => window.open('https://claude.ai/code', '_blank')}
                  className="flex items-center space-x-2 text-orange-300 hover:text-orange-200 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Install Claude CLI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Terminal className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Ready to Start</h3>
            <p className="text-gray-400">
              {isInstalled === false 
                ? 'Install Claude CLI to start chatting with AI' 
                : 'Select a project path and send your first prompt'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl p-4 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white'
                }`}>
                  <p>{message.content}</p>
                  {message.attachments && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          📎 {attachment.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-2 mb-2">
          <button className="flex items-center space-x-2 text-sm text-gray-400">
            <ChevronDown className="h-4 w-4" />
            <span>Claude 3.5 Sonnet</span>
          </button>
        </div>
        
        {/* Pending Attachments */}
        {pendingAttachments.length > 0 && (
          <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-300 mb-2">Attachments ready to send:</div>
            {pendingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">
                  {attachment.type === 'video' 
                    ? `Video recording (${attachment.frames?.length || 0} frames + transcript)`
                    : 'Audio recording'
                  }
                </span>
                <button
                  onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-400 hover:text-red-300 ml-auto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={pendingAttachments.length > 0 ? "Add context for your recording..." : "Create a blog post..."}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>
          
          {/* Video Record Button */}
          <VideoRecorder
            onRecordingComplete={handleVideoRecordingComplete}
            onRecordingError={handleVideoRecordingError}
          />
          
          {/* Audio Record Button */}
          <button
            className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
            title="Record audio only"
          >
            <Mic className="h-5 w-5" />
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() && pendingAttachments.length === 0}
            className="p-3 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line, @ to mention files
        </p>
      </div>
    </div>
  )

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'agents':
        return <AgentsView />
      case 'session':
        return <SessionView />
      case 'projects':
        return <div className="p-6 text-white">Projects view coming soon...</div>
      default:
        return <HomeView />
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <TopBar />
      <div className="flex-1 overflow-hidden">
        {renderCurrentView()}
      </div>
    </div>
  )
}

export default ClauveoInterface