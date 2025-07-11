import React from 'react'
import { Loader2, Eye, Mic, Brain, Shield } from 'lucide-react'

interface ProcessingViewProps {
  progress: number
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ progress }) => {
  const steps = [
    { icon: Eye, label: 'Extracting frames', threshold: 0.2 },
    { icon: Eye, label: 'Analyzing UI elements', threshold: 0.4 },
    { icon: Mic, label: 'Transcribing audio', threshold: 0.6 },
    { icon: Brain, label: 'Generating AI response', threshold: 0.8 },
    { icon: Shield, label: 'Cleaning up files', threshold: 1.0 },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          <div className="text-center mb-8">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-3xl font-bold mb-2">Processing Magic...</h2>
            <p className="text-muted-foreground">
              Analyzing your recording and generating AI-powered insights
            </p>
          </div>
          
          <div className="space-y-6">
            {steps.map((step, index) => {
              const isCompleted = progress >= step.threshold
              const isActive = progress >= (index > 0 ? steps[index - 1].threshold : 0) && progress < step.threshold
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <span className="text-sm">✓</span>
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isCompleted 
                        ? 'text-foreground' 
                        : isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-8">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-center mt-2 text-sm text-muted-foreground">
              {Math.round(progress * 100)}% complete
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-muted rounded-lg px-4 py-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Video deleted after processing - privacy first
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessingView