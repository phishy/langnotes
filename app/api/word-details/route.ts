import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI()

export async function POST(req: Request) {
  try {
    const { word, type } = await req.json()

    let prompt = ''
    if (type?.toLowerCase() === 'verb') {
      prompt = `For the Italian verb "${word}", provide:

1. The infinitive form (wrap the verb in backticks)
2. A brief definition
3. All conjugations in present tense (io, tu, lui/lei, noi, voi, loro) - wrap each conjugated form in backticks
4. All conjugations in past tense (passato prossimo) - wrap each conjugated form in backticks
5. All conjugations in future tense - wrap each conjugated form in backticks
6. 3 example sentences using different conjugations - wrap each Italian sentence in backticks

Format the response in markdown with appropriate headers and bullet points. Ensure all Italian words and phrases are wrapped in backticks (\`like this\`) to make them playable.`
    } else {
      prompt = `For the Italian word "${word}" (${type || 'unknown type'}), provide:

1. The word type (if known) and gender (for nouns) - wrap the word in backticks
2. A detailed definition with any important notes about usage
3. Any irregular forms or variations - wrap each form in backticks
4. 5 example sentences showing different ways to use this word - wrap each Italian sentence in backticks
5. Common phrases or expressions using this word - wrap each Italian phrase in backticks

Format the response in markdown with appropriate headers and bullet points. Ensure all Italian words and phrases are wrapped in backticks (\`like this\`) to make them playable.`
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful Italian language tutor. Provide detailed, well-structured responses about Italian words and their usage. Format responses in clear markdown with all Italian words and phrases wrapped in backticks to make them playable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini",
    })

    const content = completion.choices[0].message.content || ''

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error in word-details route:', error)
    return NextResponse.json(
      { error: 'Failed to get word details' },
      { status: 500 }
    )
  }
}
