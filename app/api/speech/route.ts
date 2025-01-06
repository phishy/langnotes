import { PollyClient, SynthesizeSpeechCommand, VoiceId } from "@aws-sdk/client-polly";
import { NextResponse } from "next/server";

const polly = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to generate speech
async function generateSpeech(text: string, language: string) {
  const voiceMap: { [key: string]: VoiceId } = {
    it: "Bianca", // Italian
    es: "Conchita", // Spanish
    fr: "Lea", // French
    de: "Marlene", // German
  };

  const voice: VoiceId = voiceMap[language] || "Joanna";

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: voice,
  });

  const response = await polly.send(command);
  const audioStream = response.AudioStream;

  if (!audioStream) {
    throw new Error("No audio stream returned");
  }

  const chunks = [];
  for await (const chunk of audioStream as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get('text');
  const language = url.searchParams.get('language') || 'it';

  if (!text) {
    return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
  }

  try {
    const buffer = await generateSpeech(text, language);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { text, language } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const buffer = await generateSpeech(text, language || 'it');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
