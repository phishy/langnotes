import { Configuration, OpenAIApi } from 'openai-edge'
import { NextResponse } from 'next/server'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function POST(req: Request) {
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const prompt = `
    Create a quiz based on the following content. Generate 5 multiple choice questions.
    Format the response as a JSON array of objects with the following structure:
    {
      "question": "the question text",
      "answer": "the correct answer",
      "options": ["array of 4 options including the correct answer"]
    }
    
    Content: ${content}
  `

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful quiz generator.' },
        { role: 'user', content: prompt }
      ]
    })

    const data = await response.json()
    const quizContent = JSON.parse(data.choices[0].message.content)
    
    return NextResponse.json(quizContent)
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}