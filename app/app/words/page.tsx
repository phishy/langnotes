"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Volume2, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

interface Word {
  id: string
  word: string
  translation: string | null
  type: string | null
  created_at: string
  wordId: number
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
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
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
            created_at: item.words.created_at,
            wordId: item.word_id
          }))

        setWords(vocabularyWords)
        setFilteredWords(vocabularyWords)
      } catch (error) {
        console.error('Error loading words:', error)
        toast.error('Failed to load words')
      } finally {
        setLoading(false)
      }
    }

    loadWords()
  }, [supabase])

  // Filter words based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const filtered = words.filter(word =>
      word.word.toLowerCase().includes(query) ||
      (word.translation?.toLowerCase() || '').includes(query)
    )
    setFilteredWords(filtered)
  }, [searchQuery, words])

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            {words.length === 0 ? (
              <>
                <p className="text-muted-foreground">No words saved yet.</p>
                <p className="text-sm text-muted-foreground">Words will appear here when you chat with the AI about Italian.</p>
              </>
            ) : (
              <p className="text-muted-foreground">No matching words found.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="bg-card rounded-lg p-4 shadow-sm border hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/app/words/${word.wordId}`)}
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
        )}
      </div>
    </div>
  )
}
