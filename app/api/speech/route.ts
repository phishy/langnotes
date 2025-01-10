import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    console.log('Speech route: Starting request')
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')

    if (!text) {
      console.log('Speech route: Missing text parameter')
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Use ElevenLabs Turbo 2.5 with Italian voice
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          language_code: "it",
          optimize_streaming_latency: 3,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    // Stream the response directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })

  } catch (error) {
    console.error('Speech route: Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate speech' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
