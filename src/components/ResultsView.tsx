import React from 'react'
import { Copy, RotateCcw, Download, ExternalLink } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ResultsViewProps {
  results: {
    metadata: any
    aiResponse: string
  }
  onTryAgain: () => void
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, onTryAgain }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const downloadResults = () => {
    const blob = new Blob([results.aiResponse], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clauveo-results-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-3xl font-bold mb-2">Analysis Complete!</h2>
            <p className="text-muted-foreground">
              Here's what I found and my recommendations
            </p>
          </div>
          
          {/* Metadata Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">What I Understood</h3>
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Duration</div>
                  <div className="font-medium">{results.metadata.duration_seconds}s</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Frames Analyzed</div>
                  <div className="font-medium">{results.metadata.visual_context.frames_analyzed}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Detected Framework</div>
                  <div className="font-medium">{results.metadata.technical_context.detected_framework}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Request Type</div>
                  <div className="font-medium">{results.metadata.user_context.request_type}</div>
                </div>
              </div>
              
              {results.metadata.user_context.transcript && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">What you said:</div>
                  <div className="bg-background rounded p-3 text-sm">
                    "{results.metadata.user_context.transcript}"
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* AI Response */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">AI-Generated Solution</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(results.aiResponse)}
                  className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={downloadResults}
                  className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            
            <div className="bg-background rounded-lg overflow-hidden border border-border">
              <SyntaxHighlighter
                language="markdown"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  background: 'transparent',
                }}
              >
                {results.aiResponse}
              </SyntaxHighlighter>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onTryAgain}
              className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Record Another</span>
            </button>
            
            <button
              onClick={() => window.open('https://claude.ai/code', '_blank')}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Claude Code</span>
            </button>
          </div>
          
          {/* Privacy Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-muted rounded-lg px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Original video and audio files have been securely deleted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsView