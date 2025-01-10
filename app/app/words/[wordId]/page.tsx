"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Volume2, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { use } from 'react'

interface Word {
  id: string
  word: string
  translation: string | null
  type: string | null
  created_at: string
}

interface WordDetails {
  content: string
  isLoading: boolean
}

export default function WordPage({ params }: { params: Promise<{ wordId: string }> }) {
  const resolvedParams = use(params)
  const [word, setWord] = useState<Word | null>(null)
  const [playingAudio, setPlayingAudio] = useState(false)
  const [details, setDetails] = useState<WordDetails>({ content: '', isLoading: true })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadWord() {
      try {
        const { data, error } = await supabase
          .from('words')
          .select('*')
          .eq('id', resolvedParams.wordId)
          .single()

        if (error) throw error
        setWord(data)

        if (!data?.id) {
          throw new Error('Word not found')
        }

        // After loading the word, fetch its details
        const response = await fetch(`/api/word-details?id=${data.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) throw new Error('Failed to load word details')
        const details = await response.json()
        setDetails({ content: details.content, isLoading: false })
      } catch (error) {
        console.error('Error loading word:', error)
        toast.error('Failed to load word')
        setDetails(d => ({ ...d, isLoading: false }))
      }
    }

    loadWord()
  }, [resolvedParams.wordId, supabase])

  async function playAudio(text: string) {
    try {
      setPlayingAudio(true)
      const response = await fetch(`/api/speech?text=${encodeURIComponent(text)}&language=it`)
      if (!response.ok) throw new Error('Failed to get speech')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingAudio(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      toast.error('Failed to play audio')
      setPlayingAudio(false)
    }
  }

  if (!word) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/words')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-purple-400 hover:text-purple-300"
            onClick={() => playAudio(word.word)}
            disabled={playingAudio}
          >
            {playingAudio ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div>
            <h3 className="text-lg font-medium text-purple-400">
              {word.word.toLowerCase()}
            </h3>
            {word.translation && (
              <p className="text-sm text-muted-foreground">{word.translation}</p>
            )}
          </div>
        </div>

        {word.type && (
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {word.type}
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {details.isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MarkdownRenderer content={details.content} />
        )}
      </div>
    </div>
  )
}
