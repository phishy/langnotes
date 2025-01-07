import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Mic, Loader2, Square } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
}

async function getUserPermission(): Promise<boolean> {
  try {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Media devices not supported')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Stop the tracks to prevent the recording indicator from being shown
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Error requesting microphone permission:', error)
    return false
  }
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Check for permission on mount
    getUserPermission().then(setHasPermission)
  }, [])

  const startRecording = async () => {
    try {
      // If we haven't checked permissions yet, or need to request again
      if (!hasPermission) {
        const granted = await getUserPermission()
        if (!granted) {
          console.error('Microphone permission denied')
          return
        }
        setHasPermission(true)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp4' })
        await sendToWhisper(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      setHasPermission(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const sendToWhisper = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.mp4')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const { text } = await response.json()
      onTranscription(text)
    } catch (error) {
      console.error('Error transcribing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // If permissions API is not supported or permission was denied
  if (hasPermission === false) {
    return null
  }

  return (
    <Button
      variant="ghost"
      className="text-purple-400 hover:text-purple-300 px-4"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing || hasPermission === null}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-5 w-5 text-red-400" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  )
}
