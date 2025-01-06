"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from './ui/button'
import { Pencil, Save, Sparkles, Undo2, Redo2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu'
import { QuizModal } from './quiz-modal'
import { debounce } from '@/lib/utils'
import { useNoteStore } from '@/lib/stores/note-store'
import type { QuizQuestion } from '@/lib/schemas/quiz'

interface NoteEditorProps {
  noteId: string | null
  defaultIsEditing?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

interface Note {
  id: string
  title: string
  content: string
}

export function NoteEditor({ noteId, defaultIsEditing = false, onEditingChange }: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(defaultIsEditing)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const {
    setContent: setStoreContent,
    loadContent: loadStoreContent,
    undo: undoStore,
    redo: redoStore,
    canUndo,
    canRedo,
    getCurrentContent
  } = useNoteStore()
  const supabase = createClient()
  const audioContextRef = useRef<AudioContext | null>(null)
  const isAudioUnlockedRef = useRef(false)

  const saveNoteContent = useCallback(async (content: string) => {
    if (!noteId) return

    const { error } = await supabase
      .from('notes')
      .update({ content })
      .eq('id', noteId)

    if (error) {
      console.error('Error saving note content:', error)
    }
  }, [noteId, supabase])

  // Use ref to store the timeout ID
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const storeTimeoutRef = useRef<NodeJS.Timeout>()

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    if (noteId) {
      // Clear previous store timeout if it exists
      if (storeTimeoutRef.current) {
        clearTimeout(storeTimeoutRef.current)
      }

      // Update store after a short delay to avoid interrupting typing
      storeTimeoutRef.current = setTimeout(() => {
        setStoreContent(noteId, newContent)
      }, 300)

      // Clear previous save timeout if it exists
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Save to Supabase after a longer delay
      saveTimeoutRef.current = setTimeout(() => {
        saveNoteContent(newContent)
      }, 1000)
    }
  }, [noteId, setStoreContent, saveNoteContent])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (storeTimeoutRef.current) {
        clearTimeout(storeTimeoutRef.current)
      }
    }
  }, [])

  const loadNote = useCallback(async () => {
    if (!noteId) return
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) {
      console.error('Error loading note:', error)
      return
    }

    if (data) {
      setTitle(data.title)
      const initialContent = data.content || ''
      setContent(initialContent)
      // Initialize the history state with the initial content
      loadStoreContent(noteId, initialContent)
    }
  }, [noteId, supabase, loadStoreContent])

  const subscribeToChanges = useCallback(() => {
    if (!noteId) return

    const channel = supabase
      .channel(`note-${noteId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `id=eq.${noteId}`
        },
        (payload) => {
          // Only update if the change came from a different client and content is different
          const newContent = payload.new.content || ''
          if (newContent !== content) {
            setContent(newContent)
            loadStoreContent(noteId, newContent)
          }
        }
      )
      .subscribe()

    setRealtimeChannel(channel)

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  }, [noteId, supabase, loadStoreContent]) // Remove content from dependencies

  const handleUndo = useCallback(async () => {
    undoStore()
    const newContent = getCurrentContent()
    setContent(newContent)
    await saveNoteContent(newContent)
  }, [undoStore, getCurrentContent, saveNoteContent])

  const handleRedo = useCallback(async () => {
    redoStore()
    const newContent = getCurrentContent()
    setContent(newContent)
    await saveNoteContent(newContent)
  }, [redoStore, getCurrentContent, saveNoteContent])

  const handleQuiz = async () => {
    try {
      setIsGeneratingQuiz(true)
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const questions = await response.json()
      setQuestions(questions)
      setIsQuizOpen(true)
    } catch (error) {
      console.error('Error generating quiz:', error)
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  useEffect(() => {
    setIsEditing(defaultIsEditing)
  }, [defaultIsEditing])

  useEffect(() => {
    onEditingChange?.(isEditing)
  }, [isEditing, onEditingChange])

  useEffect(() => {
    if (noteId) {
      loadNote()
      const cleanup = subscribeToChanges()
      return () => {
        cleanup?.()
      }
    } else {
      setTitle('')
      setContent('')
      setIsEditing(false)
    }
  }, [noteId, loadNote, subscribeToChanges])

  const saveNote = async () => {
    if (!noteId) return
    setIsSaving(true)
    const currentContent = content // Get current content before async operation

    const { error } = await supabase
      .from('notes')
      .update({ title, content: currentContent })
      .eq('id', noteId)

    setIsSaving(false)
    if (error) {
      console.error('Error saving note:', error)
      return
    }

    setIsEditing(false)
  }

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    if (!noteId) return

    const { error } = await supabase
      .from('notes')
      .update({ title: newTitle })
      .eq('id', noteId)

    if (error) {
      console.error('Error updating title:', error)
    }
  }

  // Initialize AudioContext on mount
  useEffect(() => {
    // Create AudioContext when component mounts
    audioContextRef.current = new AudioContext()

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [])

  const unlockAudioContext = useCallback(async () => {
    if (!audioContextRef.current || isAudioUnlockedRef.current) return

    // Create a silent buffer
    const buffer = audioContextRef.current.createBuffer(1, 1, 22050)
    const source = audioContextRef.current.createBufferSource()
    source.buffer = buffer
    source.connect(audioContextRef.current.destination)
    source.start(0)

    // Resume context if needed
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    isAudioUnlockedRef.current = true
  }, [])

  const handlePhraseClick = useCallback(async (phrase: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        return
      }

      // Unlock audio context first
      await unlockAudioContext()

      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase, language: 'it' }), // Default to Italian
      })

      const { audio } = await response.json()
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        Buffer.from(audio, 'base64').buffer
      )
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }, [unlockAudioContext])

  const highlightForTranslation = useCallback((selectedText: string) => {
    if (!noteId) return
    const selection = window.getSelection()
    if (!selection || !selection.toString().trim()) return

    const range = selection.getRangeAt(0)
    const start = range.startOffset
    const end = range.endOffset

    // Get the full content and insert backticks around the selected text
    const newContent = content.slice(0, start) +
      '`' + selectedText + '`' +
      content.slice(end)

    // Update content state and store
    setContent(newContent)
    setStoreContent(noteId, newContent)

    // Save to Supabase
    saveNoteContent(newContent)
  }, [content, noteId, setStoreContent, saveNoteContent])
  const renderMarkdown = useCallback((text: string) => {
    return text.replace(/`([^`]+)`/g, (_, phrase) => {
      return `<span class="cursor-pointer text-primary hover:underline" onclick="handlePhraseClick('${phrase}')">\`${phrase}\`</span>`
    })
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup AudioContext when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  if (!noteId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select a note to view or edit
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        {isEditing ? (
          <input
            className="font-semibold bg-transparent border-none focus:outline-none"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        ) : (
          <div className="flex items-center gap-4">
            <h2 className="font-semibold">{title}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <Button
          onClick={isEditing ? saveNote : () => setIsEditing(true)}
          variant="ghost"
          size="icon"
          disabled={isSaving}
        >
          {isEditing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </Button>
      </div>

      {!isEditing && (
        <div className="border-b px-4 py-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300"
            onClick={handleQuiz}
            disabled={isGeneratingQuiz}
          >
            {isGeneratingQuiz ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Quiz Me
          </Button>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full p-2 border rounded-md bg-background"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
          />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className="prose prose-sm max-w-none prose-invert ai-markdown"
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.tagName === 'CODE') {
                    handlePhraseClick(target.textContent || '')
                  }
                }}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  const selectedText = window.getSelection()?.toString() || ''
                  if (selectedText.trim()) {
                    highlightForTranslation(selectedText)
                  }
                }}
              >
                Highlight for Translation
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
        <QuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          questions={questions}
          content={content}
        />
      </div>
    </div>
  )
}
