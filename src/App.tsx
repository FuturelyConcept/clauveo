import { useState } from 'react'
import { VideoIcon, Settings, Info } from 'lucide-react'
import RecordingView from './components/RecordingView'
import SettingsView from './components/SettingsView'
import AboutView from './components/AboutView'

function App() {
  const [activeView, setActiveView] = useState('recording')

  const renderView = () => {
    switch (activeView) {
      case 'recording':
        return <RecordingView />
      case 'settings':
        return <SettingsView />
      case 'about':
        return <AboutView />
      default:
        return <RecordingView />
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <VideoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Clauveo</h1>
        </div>
        
        <nav className="flex flex-col space-y-2">
          <button
            onClick={() => setActiveView('recording')}
            className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
              activeView === 'recording' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            }`}
          >
            <VideoIcon className="h-5 w-5" />
            <span>Recording</span>
          </button>
          
          <button
            onClick={() => setActiveView('settings')}
            className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
              activeView === 'settings' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => setActiveView('about')}
            className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
              activeView === 'about' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            }`}
          >
            <Info className="h-5 w-5" />
            <span>About</span>
          </button>
        </nav>
        
        <div className="mt-auto">
          <div className="text-xs text-muted-foreground p-2">
            Privacy-first screen recording
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  )
}

export default App