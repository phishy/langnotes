import OpenAI from 'openai';
import { NextResponse } from 'next/server';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { question, answer, content } = await req.json();

  if (!question || !answer || !content) {
    return NextResponse.json({ error: 'Question, answer, and content are required' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful language learning assistant. Explain why the given answer is correct for the question, using the provided content as context.
          Focus on helping the user understand the concept deeply. Keep the explanation clear and concise.

          Format your response in markdown with:
          - Use **bold** for key terms and concepts
          - Use bullet points for listing related information
          - Use > for important quotes from the content
          - Use \`backticks\` for specific words or phrases being discussed
          - Use --- for separating sections if needed`
        },
        {
          role: 'user',
          content: `Content: ${content}\n\nQuestion: ${question}\nCorrect Answer: ${answer}\n\nWhy is this the correct answer?`
        },
      ],
    });

    const explanation = completion.choices[0].message.content;
    if (!explanation) {
      throw new Error('No explanation in response');
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
