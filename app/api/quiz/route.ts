import { Configuration, OpenAIApi } from 'openai-edge'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

const QuizQuestion = z.object({
  question: z.string(),
  correctAnswer: z.string(),
  options: z.array(z.string()).length(4),
  explanation: z.string()
})

const QuizResponse = z.array(QuizQuestion).min(1)

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get user's saved words
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (wordsError) throw wordsError
    if (!words?.length) {
      return new Response(JSON.stringify({ error: 'No words found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate quiz questions using OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: false,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `Generate quiz questions based on these Italian words. Each question should test the user's understanding of the word's meaning, usage, or grammar.

Words data:
${words.map(w => `- ${w.word} (${w.translation || 'no translation'}) [${w.type || 'no type'}]`).join('\n')}

Create questions that:
1. Test vocabulary understanding
2. Include grammar concepts when relevant
3. Test proper usage in context
4. Mix different types of questions (multiple choice, fill in the blank, etc.)
5. Include clear explanations for the correct answers`
        }
      ],
      functions: [
        {
          name: 'generateQuiz',
          description: 'Generate quiz questions from Italian vocabulary',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'The quiz question'
                    },
                    correctAnswer: {
                      type: 'string',
                      description: 'The correct answer'
                    },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 4,
                      maxItems: 4,
                      description: 'Four possible answers including the correct one'
                    },
                    explanation: {
                      type: 'string',
                      description: 'Explanation of why this is the correct answer'
                    }
                  },
                  required: ['question', 'correctAnswer', 'options', 'explanation']
                }
              }
            },
            required: ['questions']
          }
        }
      ],
      function_call: { name: 'generateQuiz' }
    })

    const data = await response.json()
    const quizData = JSON.parse(data.choices[0].message.function_call.arguments)
    const validatedQuiz = QuizResponse.parse(quizData.questions)

    return new Response(JSON.stringify(validatedQuiz), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error generating quiz:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate quiz' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
