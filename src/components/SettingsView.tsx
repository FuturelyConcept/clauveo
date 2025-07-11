import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Key, Save, TestTube, Cpu } from 'lucide-react'
import { testAIConnection, type AIProvider } from '../lib/aiClient'

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    claudeApiKey: '',
    geminiApiKey: '',
    aiProvider: 'openai' as AIProvider,
    defaultRecordingDuration: 60,
    autoDeleteFiles: true,
    showAdvancedSettings: false,
  })
  
  // Load saved settings on component mount
  useEffect(() => {
    const savedOpenAIKey = localStorage.getItem('openai_api_key') || ''
    const savedClaudeKey = localStorage.getItem('claude_api_key') || ''
    const savedGeminiKey = localStorage.getItem('gemini_api_key') || ''
    const savedAIProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'openai'
    const savedSettings = localStorage.getItem('clauveo_settings')
    
    let parsedSettings = {}
    if (savedSettings) {
      try {
        parsedSettings = JSON.parse(savedSettings)
      } catch (error) {
        console.warn('Failed to parse saved settings:', error)
      }
    }
    
    setSettings(prev => ({
      ...prev,
      openaiApiKey: savedOpenAIKey,
      claudeApiKey: savedClaudeKey,
      geminiApiKey: savedGeminiKey,
      aiProvider: savedAIProvider,
      ...parsedSettings
    }))
  }, [])
  
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [testResults, setTestResults] = useState<{openai?: string, claude?: string, gemini?: string}>({})

  const handleSave = () => {
    // Save settings to localStorage
    console.log('Saving settings:', settings)
    
    // Save API keys to localStorage
    if (settings.openaiApiKey) {
      localStorage.setItem('openai_api_key', settings.openaiApiKey)
    }
    if (settings.claudeApiKey) {
      localStorage.setItem('claude_api_key', settings.claudeApiKey)
    }
    if (settings.geminiApiKey) {
      localStorage.setItem('gemini_api_key', settings.geminiApiKey)
    }
    
    // Save AI provider preference
    localStorage.setItem('ai_provider', settings.aiProvider)
    
    // Save other settings
    localStorage.setItem('clauveo_settings', JSON.stringify({
      defaultRecordingDuration: settings.defaultRecordingDuration,
      autoDeleteFiles: settings.autoDeleteFiles,
      showAdvancedSettings: settings.showAdvancedSettings
    }))
    
    console.log('✅ Settings saved successfully!')
  }

  const testConnection = async (provider: AIProvider, apiKey: string) => {
    try {
      setTestResults(prev => ({ ...prev, [provider]: 'testing' }))
      const isConnected = await testAIConnection(provider, apiKey)
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: isConnected ? 'success' : 'error' 
      }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }))
    }
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Settings</h2>
            <p className="text-muted-foreground">
              Configure your API keys and recording preferences
            </p>
          </div>
          
          <div className="space-y-8">
            {/* API Configuration */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Configuration
              </h3>
              
              {/* AI Provider Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Cpu className="h-4 w-4 mr-2" />
                  AI Provider
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings(prev => ({ ...prev, aiProvider: e.target.value as AIProvider }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="openai">OpenAI (GPT-4)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Claude (Coming Soon)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose your preferred AI provider for code generation
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    OpenAI API Key
                  </label>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showOpenAIKey ? 'text' : 'password'}
                          value={settings.openaiApiKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                          placeholder="sk-..."
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      <button
                        type="button"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => testConnection('openai', settings.openaiApiKey)}
                      disabled={!settings.openaiApiKey || testResults.openai === 'testing'}
                      className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>Test</span>
                    </button>
                  </div>
                  </form>
                  {testResults.openai && (
                    <div className={`mt-2 text-sm ${
                      testResults.openai === 'success' 
                        ? 'text-green-600' 
                        : testResults.openai === 'error' 
                        ? 'text-red-600' 
                        : 'text-yellow-600'
                    }`}>
                      {testResults.openai === 'success' && '✓ Connection successful'}
                      {testResults.openai === 'error' && '✗ Connection failed'}
                      {testResults.openai === 'testing' && '⏳ Testing connection...'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Google Gemini API Key
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                        placeholder="AIza..."
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => testConnection('gemini', settings.geminiApiKey)}
                      disabled={!settings.geminiApiKey || testResults.gemini === 'testing'}
                      className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>Test</span>
                    </button>
                  </div>
                  {testResults.gemini && (
                    <div className={`mt-2 text-sm ${
                      testResults.gemini === 'success' 
                        ? 'text-green-600' 
                        : testResults.gemini === 'error' 
                        ? 'text-red-600' 
                        : 'text-yellow-600'
                    }`}>
                      {testResults.gemini === 'success' && '✓ Connection successful'}
                      {testResults.gemini === 'error' && '✗ Connection failed'}
                      {testResults.gemini === 'testing' && '⏳ Testing connection...'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Claude API Key (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showClaudeKey ? 'text' : 'password'}
                        value={settings.claudeApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, claudeApiKey: e.target.value }))}
                        placeholder="sk-ant-..."
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClaudeKey(!showClaudeKey)}
                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {showClaudeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => testConnection('claude', settings.claudeApiKey)}
                      disabled={!settings.claudeApiKey || testResults.claude === 'testing'}
                      className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>Test</span>
                    </button>
                  </div>
                  {testResults.claude && (
                    <div className={`mt-2 text-sm ${
                      testResults.claude === 'success' 
                        ? 'text-green-600' 
                        : testResults.claude === 'error' 
                        ? 'text-red-600' 
                        : 'text-yellow-600'
                    }`}>
                      {testResults.claude === 'success' && '✓ Connection successful'}
                      {testResults.claude === 'error' && '✗ Connection failed'}
                      {testResults.claude === 'testing' && '⏳ Testing connection...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recording Settings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Recording Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default Recording Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={settings.defaultRecordingDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultRecordingDuration: parseInt(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoDelete"
                    checked={settings.autoDeleteFiles}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoDeleteFiles: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                  <label htmlFor="autoDelete" className="text-sm font-medium">
                    Automatically delete video/audio files after processing
                  </label>
                </div>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-2">🔒 Privacy Notice</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• API keys are stored securely on your local machine only</li>
                <li>• No data is transmitted to our servers</li>
                <li>• Video and audio files are processed locally</li>
                <li>• Only metadata is sent to AI services</li>
                <li>• All temporary files are deleted after processing</li>
              </ul>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Save className="h-5 w-5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsView