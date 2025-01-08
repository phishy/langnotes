import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful Italian learning assistant. You help users learn languages by answering their questions about grammar, vocabulary, pronunciation, and culture. You provide clear, concise explanations and examples. You can also help with translations and language comparisons.'
      },
      ...messages
    ]
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
