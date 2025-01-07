import OpenAI from 'openai'
import { NextResponse } from 'next/server'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { prompt, content } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions about language learning notes.
Your task is to:
1. Answer the user's question about the provided note content
2. Use clear and concise explanations
3. Format your response in markdown
4. Use bullet points for lists
5. Use \`backticks\` when referencing specific words or phrases from the note
6. Use > for important quotes from the content
7. Use bold for key concepts
8. Keep the same language as used in the note content when appropriate`
        },
        {
          role: "user",
          content: `Here is the note content:\n\n${content || ''}\n\nUser's question: ${prompt}`
        }
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content || 'Sorry, I could not process your request.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error processing custom prompt:', error)
    return NextResponse.json(
      { error: 'Failed to process prompt' },
      { status: 500 }
    )
  }
}
