import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.createChatCompletion({
    model: "gpt-4o",
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful Italian language learning assistant. If I type something, translate it, unless I am asking for more general help. When providing examples of words or phrases in foreign languages, always wrap them in backticks. Keep responses concise and focused on language learning. Ensure that any Italian phrases are wrapped in backticks. When the user is asking for a translation and you provide it, provide the original phrase too",
      },
      ...messages,
      {
        role: "system",
        content:
          "Do not forget to wrap any Italian phrases in backticks"
      },
    ],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
