import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ProcessedMetadata } from './videoProcessor'

interface AIResponse {
  analysis: string
  solution: string
  codeExamples: string[]
  recommendations: string[]
}

export type AIProvider = 'openai' | 'gemini' | 'claude'

const getOpenAIClient = () => {
  const apiKey = localStorage.getItem('openai_api_key')
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}

const getGeminiClient = () => {
  const apiKey = localStorage.getItem('gemini_api_key')
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

const getSelectedAIProvider = (): AIProvider => {
  return (localStorage.getItem('ai_provider') as AIProvider) || 'openai'
}

export const generatePrompt = (metadata: ProcessedMetadata): string => {
  const { user_context, visual_context, technical_context } = metadata
  
  // Handle calculation requests differently
  if (user_context.request_type === 'calculation') {
    return `You are a helpful assistant that can perform calculations.

## User Request
The user is asking for help with a calculation: "${user_context.transcript}"

## Text Content Detected
${visual_context.text_content.join(', ')}

## Your Task
1. Identify the mathematical expression or calculation needed
2. Perform the calculation accurately
3. Provide the answer clearly and directly
4. If relevant, show the calculation steps

Please provide a direct, clear answer to the mathematical question. Keep your response concise and focused on the calculation.`
  }
  
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

const generateOpenAIResponse = async (metadata: ProcessedMetadata): Promise<string> => {
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
}

const generateGeminiResponse = async (metadata: ProcessedMetadata): Promise<string> => {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = generatePrompt(metadata)
  const systemPrompt = 'You are an expert software developer and code reviewer. Provide practical, actionable solutions to development issues. Always include specific code examples and explain the reasoning behind your recommendations.'
  
  const fullPrompt = `${systemPrompt}\n\n${prompt}`
  
  const result = await model.generateContent(fullPrompt)
  const response = await result.response
  return response.text()
}

export const analyzeFrameWithVision = async (frameBase64: string, provider: AIProvider = 'gemini'): Promise<string> => {
  try {
    if (provider === 'gemini') {
      const genAI = getGeminiClient()
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      // Remove data URL prefix to get just base64
      const base64Data = frameBase64.replace(/^data:image\/[a-z]+;base64,/, '')
      
      const result = await model.generateContent([
        "Analyze this screenshot and extract ALL text content accurately. Pay special attention to mathematical expressions, numbers, and symbols. Describe what you see in detail.",
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ])
      
      const response = await result.response
      return response.text()
    } else if (provider === 'openai') {
      const openai = getOpenAIClient()
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this screenshot and extract ALL text content accurately. Pay special attention to mathematical expressions, numbers, and symbols. Describe what you see in detail."
              },
              {
                type: "image_url",
                image_url: {
                  url: frameBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
      
      return response.choices[0]?.message?.content || 'No analysis available'
    }
    
    throw new Error(`Vision analysis not supported for provider: ${provider}`)
    
  } catch (error) {
    console.error('Error analyzing frame with vision:', error)
    return `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export const generateAIResponse = async (metadata: ProcessedMetadata): Promise<string> => {
  try {
    const provider = getSelectedAIProvider()
    
    switch (provider) {
      case 'openai':
        return await generateOpenAIResponse(metadata)
      case 'gemini':
        return await generateGeminiResponse(metadata)
      case 'claude':
        throw new Error('Claude integration not yet implemented')
      default:
        throw new Error(`Unknown AI provider: ${provider}`)
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const provider = getSelectedAIProvider()
    
    // Only OpenAI has Whisper API for audio transcription
    // For other providers, we'll need to use OpenAI for transcription or skip it
    if (provider === 'openai') {
      const openai = getOpenAIClient()
      
      // Convert blob to file for OpenAI API
      const audioFile = new File([audioBlob], 'audio.wav', { type: audioBlob.type })
      
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        prompt: 'The user is explaining their screen recording content, which may include math problems, development issues, or questions.'
      })
      
      return response.text
    } else {
      // For Gemini and other providers, skip audio transcription for now
      console.log(`Audio transcription not available for ${provider} provider. Skipping audio processing.`)
      return 'Audio transcription skipped - not available for current AI provider'
    }
    
  } catch (error) {
    console.error('Error transcribing audio:', error)
    
    // Fallback to a default transcript if transcription fails
    return 'Audio transcription failed'
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

export const testGeminiConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const result = await model.generateContent('Test')
    const response = await result.response
    return response.text().length > 0
    
  } catch (error) {
    console.error('Gemini connection test failed:', error)
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

export const testAIConnection = async (provider: AIProvider, apiKey: string): Promise<boolean> => {
  switch (provider) {
    case 'openai':
      return testOpenAIConnection(apiKey)
    case 'gemini':
      return testGeminiConnection(apiKey)
    case 'claude':
      return testClaudeConnection(apiKey)
    default:
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