"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Word {
  id: string
  word: string
  translation: string | null
  type: string | null
  created_at: string
}

interface VocabularyWithWord {
  word_id: number
  words: {
    id: string
    word: string
    translation: string | null
    type: string | null
    created_at: string
  }
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadWords() {
      try {
        const { data, error } = await supabase
          .from('vocabularies')
          .select(`
            word_id,
            words (
              id,
              word,
              translation,
              type,
              created_at
            )
          `)
          .order('words(word)', { ascending: true }) as { data: VocabularyWithWord[] | null, error: any }

        if (error) throw error

        // Transform the nested data structure
        const vocabularyWords = (data || [])
          .map(item => ({
            id: item.words.id,
            word: item.words.word,
            translation: item.words.translation,
            type: item.words.type,
            created_at: item.words.created_at
          }))

        setWords(vocabularyWords)
      } catch (error) {
        console.error('Error loading words:', error)
        toast.error('Failed to load words')
      } finally {
        setLoading(false)
      }
    }

    loadWords()
  }, [supabase])

  async function playAudio(word: string, id: string) {
    try {
      setPlayingId(id)

      // Get the cached URL or generate new speech
      const response = await fetch(`/api/speech?text=${encodeURIComponent(word)}&language=it`)
      if (!response.ok) throw new Error('Failed to get speech URL')

      const { url } = await response.json()
      const audio = new Audio(url)
      audio.onended = () => setPlayingId(null)
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      toast.error('Failed to play audio')
      setPlayingId(null)
    }
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
        <p className="text-muted-foreground">No words saved yet.</p>
        <p className="text-sm text-muted-foreground">Words will appear here when you chat with the AI about Italian.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {words.map((word) => (
          <div
            key={word.id}
            className="bg-card rounded-lg p-4 shadow-sm border hover:border-purple-500/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/app/words/${word.id}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-purple-400 hover:text-purple-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    playAudio(word.word, word.id)
                  }}
                  disabled={playingId === word.id}
                >
                  {playingId === word.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <h3
                    className="text-lg font-medium text-purple-400 hover:text-purple-300"
                  >
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
          </div>
        ))}
      </div>
    </div>
  )
}
