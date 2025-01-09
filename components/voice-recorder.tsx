import { useState, useRef } from 'react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    setIsRequesting(true)
    try {
      const hasPermission = await getUserPermission()
      if (!hasPermission) {
        console.error('Microphone permission denied')
        setIsRequesting(false)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        setIsLoading(true)
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', audioBlob)

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Transcription failed')
          }

          const { text } = await response.json()
          onTranscription(text)
        } catch (error) {
          console.error('Error transcribing audio:', error)
        } finally {
          setIsLoading(false)
          setIsRecording(false)
        }

        // Clean up the stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.current.start(250);
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-purple-400 hover:text-purple-300"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isLoading || isRequesting}
    >
      {isLoading || isRequesting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  )
}
