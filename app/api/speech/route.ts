import { PollyClient, SynthesizeSpeechCommand, VoiceId } from "@aws-sdk/client-polly"

// Initialize Polly client
const polly = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: Request) {
  try {
    console.log('Speech route: Starting request')
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    const language = searchParams.get('language') || 'it'

    if (!text) {
      console.log('Speech route: Missing text parameter')
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const voiceMap: { [key: string]: VoiceId } = {
      it: "Bianca", // Italian
      es: "Conchita", // Spanish
      fr: "Lea", // French
      de: "Marlene", // German
    }

    const voice: VoiceId = voiceMap[language] || "Bianca"

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voice,
    })

    const response = await polly.send(command)
    const audioStream = response.AudioStream

    if (!audioStream) {
      throw new Error("No audio stream returned")
    }

    // Return the audio stream directly
    return new Response(audioStream as any, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    })

  } catch (error) {
    console.error('Speech route: Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate speech' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
