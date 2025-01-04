import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { NextResponse } from "next/server";

const polly = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { text, language } = await req.json();

  // Map language codes to Polly voices
  const voiceMap: { [key: string]: string } = {
    it: "Bianca", // Italian
    es: "Conchita", // Spanish
    fr: "Lea", // French
    de: "Marlene", // German
  };

  const voice = voiceMap[language] || "Joanna";

  try {
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

    // Convert audio stream to base64
    const chunks = [];
    for await (const chunk of audioStream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const base64Audio = buffer.toString("base64");

    return NextResponse.json({ audio: base64Audio });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}