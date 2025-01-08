import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { PollyClient, SynthesizeSpeechCommand, VoiceId } from "@aws-sdk/client-polly"

const BUCKET_NAME = 'speech-cache'

// Create a Supabase client with the service role key
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Polly client
const polly = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Helper function to generate speech
async function generateSpeech(text: string, language: string) {
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

  const chunks = []
  for await (const chunk of audioStream as any) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function GET(request: Request) {
  try {
    console.log('Speech route: Starting request')
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    const language = searchParams.get('language') || 'it'

    if (!text) {
      console.log('Speech route: Missing text parameter')
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      )
    }

    console.log('Speech route: Creating hash for:', text)
    // Create a hash of the text and language to use as the filename
    const hash = createHash('md5')
      .update(`${text}-${language}`)
      .digest('hex')
    const filename = `${hash}.mp3`
    console.log('Speech route: Generated filename:', filename)

    // Check if the file exists in storage
    console.log('Speech route: Checking if file exists in storage')
    const { data: existingFile, error: downloadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(filename)

    if (existingFile) {
      console.log('Speech route: Found existing file, returning cached URL')
      const { data: urlData } = await supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename)
      return NextResponse.json({ url: urlData.publicUrl })
    }

    if (downloadError && downloadError.message !== 'The resource was not found') {
      console.error('Speech route: Error checking file existence:', downloadError)
    }

    console.log('Speech route: No cached file found, generating new speech')
    // If file doesn't exist, generate new speech
    const audioData = await generateSpeech(text, language)

    console.log('Speech route: Uploading to Supabase storage')
    // Upload to Supabase storage
    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filename, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // Cache for 1 year
      })

    if (uploadError) {
      console.error('Speech route: Error uploading to storage:', uploadError)
      // If upload fails, still return the audio data directly
      console.log('Speech route: Returning audio data directly due to upload failure')
      return new Response(audioData, {
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    }

    console.log('Speech route: Getting public URL for uploaded file')
    // Get the public URL of the uploaded file
    const { data: fileData } = await supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    console.log('Speech route: Successfully completed, returning URL')
    return NextResponse.json({ url: fileData.publicUrl })
  } catch (error) {
    console.error('Speech route: Unhandled error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
