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
  console.log('[Search API] Starting request processing')
  try {
    const { messages } = await req.json()
    console.log('[Search API] Received messages:', messages.length)

    const supabase = await createClient()
    console.log('[Search API] Supabase client created')

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
    console.log('[Search API] Created streaming response')

    // In the background, get structured data and save to Supabase
    const structuredPromise = (async () => {
      try {
        console.log('[Search API] Starting structured data processing')
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
        console.log('[Search API] Got structured response from OpenAI')

        const structuredData = await structuredResponse.json()
        const responseData = JSON.parse(structuredData.choices[0].message.function_call.arguments)
        console.log('[Search API] Parsed structured data:', {
          contentLength: responseData.content?.length,
          wordsCount: responseData.words?.length
        })

        // Save to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        console.log('[Search API] Got user:', user?.id)

        if (user) {
          // Save the search
          const { data: searchData, error: searchError } = await supabase
            .from('searches')
            .insert([{
              query: messages[messages.length - 1].content,
              response: responseData,
              language_id: 1
            }])
            .select()

          if (searchError) {
            console.error('[Search API] Error inserting search:', searchError)
          } else {
            console.log('[Search API] Successfully inserted search:', searchData[0]?.id)
          }
        }
      } catch (error) {
        console.error('[Search API] Error in structured data processing:', error)
      }
    })()

    console.log('[Search API] Returning streaming response')
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('[Search API] Fatal error:', error)
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
