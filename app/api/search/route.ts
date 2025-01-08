import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { createClient } from '@/utils/supabase/server'
import { SearchResponse } from '@/lib/schemas/search'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()

    // Start streaming the response immediately
    const stream = OpenAIStream(await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: true,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful Italian language learning assistant. Help users learn Italian by answering their questions about grammar, vocabulary, pronunciation, and culture. Always wrap Italian words and phrases in backticks.'
        },
        ...messages,
        {
          role: 'system',
          content: 'Do not forget to wrap Italian words and phrases in backticks.'
        }
      ]
    }))

    // In the background, get structured data and save to Supabase
    const structuredPromise = (async () => {
      try {
        const structuredResponse = await openai.createChatCompletion({
          model: 'gpt-4o',
          stream: false,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `You are a helpful Italian language learning assistant. Extract all Italian words and phrases from this conversation.

Your response should be in JSON format with two fields:
- content: A markdown-formatted response that matches your previous response
- words: An array of objects for each Italian word/phrase used, each containing:
  - word: The Italian word/phrase
  - translation: English translation (if applicable)
  - type: Word type (noun, verb, adjective, etc.) if applicable`
            },
            ...messages
          ],
          functions: [
            {
              name: 'respond',
              description: 'Respond to the user\'s query with structured output',
              parameters: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description: 'The markdown-formatted response'
                  },
                  words: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        word: {
                          type: 'string',
                          description: 'The Italian word or phrase'
                        },
                        translation: {
                          type: 'string',
                          description: 'English translation of the word or phrase'
                        },
                        type: {
                          type: 'string',
                          description: 'Word type (noun, verb, adjective, etc.)'
                        }
                      },
                      required: ['word']
                    }
                  }
                },
                required: ['content', 'words']
              }
            }
          ],
          function_call: { name: 'respond' }
        })

        const structuredData = await structuredResponse.json()
        const responseData = JSON.parse(structuredData.choices[0].message.function_call.arguments)

        // Save to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Save the search
          await supabase
            .from('searches')
            .insert([{
              query: messages[messages.length - 1].content,
              response: responseData,
            }])

          // Bulk insert words using upsert to avoid duplicates
          if (responseData.words?.length > 0) {
            const wordsToInsert = responseData.words.map((word: { word: string; translation?: string; type?: string }) => ({
              word: word.word,
              translation: word.translation || null,
              type: word.type || null,
            }))

            await supabase
              .from('words')
              .upsert(wordsToInsert)
          }
        }
      } catch (error) {
        console.error('Error processing structured data:', error)
      }
    })()

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error in search API:', error)
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
