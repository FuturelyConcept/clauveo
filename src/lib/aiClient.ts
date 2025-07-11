import OpenAI from 'openai'
import type { ProcessedMetadata } from './videoProcessor'

interface AIResponse {
  analysis: string
  solution: string
  codeExamples: string[]
  recommendations: string[]
}

const getOpenAIClient = () => {
  const apiKey = localStorage.getItem('openai_api_key')
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}

export const generatePrompt = (metadata: ProcessedMetadata): string => {
  const { user_context, visual_context, technical_context } = metadata
  
  return `You are a senior developer helping to analyze a screen recording and provide code solutions.

## Context
- **Recording Duration**: ${metadata.duration_seconds} seconds
- **User Said**: "${user_context.transcript}"
- **Request Type**: ${user_context.request_type}
- **User Emotion**: ${user_context.user_emotion}
- **Detected Framework**: ${technical_context.detected_framework}

## Visual Analysis
- **Frames Analyzed**: ${visual_context.frames_analyzed}
- **UI Elements Detected**: ${visual_context.ui_elements_detected.map(el => `${el.type}: "${el.text}"`).join(', ')}
- **Text Content**: ${visual_context.text_content.slice(0, 10).join(', ')}
- **Layout**: ${visual_context.layout_analysis}

## Technical Context
- **Error Patterns**: ${technical_context.error_patterns.join(', ')}
- **Suggested Focus**: ${technical_context.suggested_focus.join(', ')}
- **Keywords**: ${user_context.intent_keywords.join(', ')}

## Your Task
Based on this analysis, provide:

1. **Issue Analysis**: What is the likely problem or request?
2. **Root Cause**: What's causing this issue?
3. **Solution**: Step-by-step solution approach
4. **Code Examples**: Specific code fixes or implementations
5. **Prevention**: How to avoid this issue in the future
6. **Testing**: How to test the solution

Please provide actionable, specific code examples that can be directly implemented. Focus on the ${technical_context.suggested_focus.join(' and ')} aspects.

Format your response in markdown with clear sections and code blocks.`
}

export const generateAIResponse = async (metadata: ProcessedMetadata): Promise<string> => {
  try {
    const openai = getOpenAIClient()
    const prompt = generatePrompt(metadata)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are an expert software developer and code reviewer. Provide practical, actionable solutions to development issues. Always include specific code examples and explain the reasoning behind your recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
    
    return response.choices[0]?.message?.content || 'No response generated'
    
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const openai = getOpenAIClient()
    
    // Convert blob to file for OpenAI API
    const audioFile = new File([audioBlob], 'audio.wav', { type: audioBlob.type })
    
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      prompt: 'The user is explaining a development issue, bug, or feature request for their application.'
    })
    
    return response.text
    
  } catch (error) {
    console.error('Error transcribing audio:', error)
    
    // Fallback to a default transcript if transcription fails
    return 'User is explaining an issue with their application and needs help fixing it.'
  }
}

export const testOpenAIConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5
    })
    
    return response.choices.length > 0
    
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

export const testClaudeConnection = async (apiKey: string): Promise<boolean> => {
  try {
    // This would be implemented when Claude API is integrated
    // For now, just return true if API key is provided
    return apiKey.startsWith('sk-ant-')
    
  } catch (error) {
    console.error('Claude connection test failed:', error)
    return false
  }
}

// Enhanced prompt for different request types
export const generateContextualPrompt = (metadata: ProcessedMetadata): string => {
  const basePrompt = generatePrompt(metadata)
  const { request_type, user_emotion } = metadata.user_context
  
  let additionalContext = ''
  
  switch (request_type) {
    case 'bug_fix':
      additionalContext = `
## Bug Fix Context
The user has identified a bug in their application. Focus on:
- Debugging strategies
- Common causes of this type of issue
- Step-by-step troubleshooting
- Code fixes with explanations
- Testing to ensure the fix works`
      break
      
    case 'feature_request':
      additionalContext = `
## Feature Request Context
The user wants to add new functionality. Focus on:
- Implementation approach
- Best practices for this type of feature
- Code structure and organization
- Integration with existing code
- User experience considerations`
      break
      
    case 'refactoring':
      additionalContext = `
## Refactoring Context
The user wants to improve existing code. Focus on:
- Code quality improvements
- Performance optimizations
- Maintainability enhancements
- Modern best practices
- Migration strategies`
      break
      
    case 'question':
      additionalContext = `
## Question Context
The user needs explanation or guidance. Focus on:
- Clear explanations
- Code examples
- Best practices
- Learning resources
- Step-by-step instructions`
      break
  }
  
  // Adjust tone based on user emotion
  if (user_emotion === 'frustrated') {
    additionalContext += `
    
## Tone Adjustment
The user seems frustrated. Please:
- Be extra clear and patient in explanations
- Provide step-by-step guidance
- Offer multiple solution approaches
- Include debugging tips
- Reassure that this is a common issue`
  }
  
  return basePrompt + additionalContext
}

export const generateFollowUpQuestions = (metadata: ProcessedMetadata): string[] => {
  const questions: string[] = []
  const { technical_context, user_context } = metadata
  
  if (technical_context.detected_framework === 'unknown') {
    questions.push('What framework or technology stack are you using?')
  }
  
  if (user_context.request_type === 'bug_fix') {
    questions.push('What error messages do you see in the console?')
    questions.push('When did this issue first appear?')
  }
  
  if (technical_context.suggested_focus.includes('api_integration')) {
    questions.push('What API endpoint are you trying to access?')
    questions.push('Are you seeing any network errors in the developer tools?')
  }
  
  return questions
}