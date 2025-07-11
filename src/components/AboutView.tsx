import React from 'react'
import { Github, Heart, Shield, Zap, Eye, Trash2 } from 'lucide-react'

const AboutView: React.FC = () => {
  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-3xl font-bold mb-2">Clauveo</h2>
            <p className="text-muted-foreground text-lg">
              Privacy-first screen recording and AI-powered code generation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Privacy First</h3>
                  <p className="text-sm text-muted-foreground">
                    Everything is processed locally. No data leaves your machine except metadata to AI services.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Zap className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Record your screen, explain your needs, and get AI-generated code solutions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Eye className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Smart Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced OCR and audio processing to understand your application context.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Trash2 className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Auto Cleanup</h3>
                  <p className="text-sm text-muted-foreground">
                    Video and audio files are automatically deleted after processing for your privacy.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Heart className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Developer Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    Built by developers, for developers. Simple workflow, powerful results.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Github className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Open Source</h3>
                  <p className="text-sm text-muted-foreground">
                    Transparent, auditable code. Built with Tauri, React, and Rust.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <h3 className="text-xl font-semibold mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl mb-2">🎬</div>
                <div className="font-semibold mb-1">Record</div>
                <div className="text-xs text-muted-foreground">
                  Capture your screen and voice for up to 60 seconds
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold mb-1">Process</div>
                <div className="text-xs text-muted-foreground">
                  Extract frames, transcribe audio, analyze UI elements
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-semibold mb-1">Generate</div>
                <div className="text-xs text-muted-foreground">
                  AI creates code solutions based on your context
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <div className="font-semibold mb-1">Cleanup</div>
                <div className="text-xs text-muted-foreground">
                  Original files deleted, only results remain
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Version 0.1.0</div>
                <div className="text-sm text-muted-foreground">
                  Built with Tauri 2.0, React 18, and Rust
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => window.open('https://github.com/clauveo/clauveo', '_blank')}
                  className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </button>
                
                <button
                  onClick={() => window.open('https://clauveo.com', '_blank')}
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  <span>Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutView