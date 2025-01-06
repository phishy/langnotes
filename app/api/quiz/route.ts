import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { QuizResponse } from '@/lib/schemas/quiz';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful quiz generator. Create a quiz based on the provided content with exactly 5 multiple choice questions.
          Each question must have exactly 4 options, with one correct answer.
          The response must be a JSON object with this exact structure:
          {
            "questions": [
              {
                "question": "Question text here",
                "answer": "The correct answer here (must be one of the options)",
                "options": ["option1", "option2", "option3", "option4"]
              }
            ]
          }`
        },
        { role: 'user', content },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in response');
    }

    const response = JSON.parse(responseContent);
    const parsedQuestions = QuizResponse.parse(response.questions);
    return NextResponse.json(parsedQuestions);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
