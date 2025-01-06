import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI()

export async function POST(req: Request) {
  try {
    const { content, prompt } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that cleans up and reformats notes. Your task is to:
1. Fix any spelling and grammar errors
2. Improve formatting and structure
3. Make the content more concise and clear
4. Preserve any code blocks or special markdown formatting
5. Keep the same language as the original text
6. Preserve any backticked phrases for language learning
7. Maintain the overall meaning and key points

Additional instructions from the user: ${prompt}

Return only the cleaned up content, with no explanations or additional text.`
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent formatting
    })

    const cleanContent = completion.choices[0].message.content || content

    return NextResponse.json({ cleanContent })
  } catch (error) {
    console.error('Error cleaning up content:', error)
    return NextResponse.json(
      { error: 'Failed to clean up content' },
      { status: 500 }
    )
  }
}
