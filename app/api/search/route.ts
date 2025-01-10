import { OpenAIStream, StreamingTextResponse } from "ai"
import { Configuration, OpenAIApi } from "openai-edge"
import { createClient } from "@/utils/supabase/server"

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

export const runtime = "edge"

export async function POST(req: Request) {
  console.log("[Search API] Starting request processing")
  try {
    const { messages } = await req.json()
    console.log("[Search API] Received messages:", messages.length)

    const supabase = await createClient()
    console.log("[Search API] Supabase client created")

    // Create the streaming response
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a helpful Italian language learning assistant. Help users learn Italian by answering their questions about grammar, vocabulary, pronunciation, and culture. Always wrap Italian words and phrases in backticks. Always give the most colloqual answer possible. If asked to conjugate, put it into a table (labels should be in English)`,
        },
        ...messages,
        {
          role: "system",
          content:
            "All Italian words and phrases should be wrapped in backticks in the markdown",
        },
        {
          role: "system",
          content:
            "All Italian words and phrases should be wrapped in backticks in the markdown even in tables.",
        },
      ],
    })

    // Clone the response for background processing
    const responseForBackground = response.clone()

    // Start streaming immediately
    const stream = OpenAIStream(response)

    // Process structured data in the background
    const processStructuredData = async () => {
      try {
        const textStream = OpenAIStream(responseForBackground)
        let fullText = ''
        const textDecoder = new TextDecoder()
        const reader = textStream.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += textDecoder.decode(value)
        }

        // Process the structured data
        const structuredResponse = await openai.createChatCompletion({
          model: "gpt-4o",
          stream: false,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `Extract all Italian words and phrases from this text. The text is: ${fullText}

Your response should be in JSON format with two fields:
- content: The exact text provided (do not modify it)
- words: An array of objects for each Italian word/phrase used, each containing:
  - word: The Italian word/phrase (without backticks)
  - translation: English translation (if applicable)
  - type: Word type (noun, verb, adjective, etc.) if applicable`,
            },
          ],
          functions: [
            {
              name: "respond",
              description: "Process the text with structured output",
              parameters: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "The exact text provided",
                  },
                  words: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: {
                          type: "string",
                          description: "The Italian word or phrase",
                        },
                        translation: {
                          type: "string",
                          description:
                            "English translation of the word or phrase",
                        },
                        type: {
                          type: "string",
                          description:
                            "Word type (noun, verb, adjective, etc.)",
                        },
                      },
                      required: ["word"],
                    },
                  },
                },
                required: ["content", "words"],
              },
            },
          ],
          function_call: { name: "respond" },
        })

        const structuredData = await structuredResponse.json()
        const responseData = JSON.parse(
          structuredData.choices[0].message.function_call.arguments
        )

        // Save to Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { error } = await supabase
            .from("searches")
            .insert([
              {
                query: messages[messages.length - 1].content,
                response: responseData,
                language_id: 1,
                created_by: user.id,
              },
            ])
            .select()

          if (error) {
            console.error("[Search API] Error inserting search:", error)
          }
        }
      } catch (error) {
        console.error("[Search API] Error processing structured data:", error)
      }
    }

    // Start processing in the background
    processStructuredData()

    // Return streaming response immediately
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("[Search API] Fatal error:", error)
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
