"use client"

import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from './ui/button'
import { Pencil, Save, Sparkles, Undo2, Redo2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu'
import { QuizModal } from './quiz-modal'
import { debounce } from '@/lib/utils'
import { useNoteStore } from '@/lib/stores/note-store'

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
  const [questions, setQuestions] = useState([])
  const [realtimeChannel, setRealtimeChannel] = useState(null)
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

  const handleUndo = async () => {
    undoStore()
    const newContent = getCurrentContent()
    setContent(newContent)
    await saveNoteContent(newContent)
  }

  const handleRedo = async () => {
    redoStore()
    const newContent = getCurrentContent()
    setContent(newContent)
    await saveNoteContent(newContent)
  }

  const saveNoteContent = async (content: string) => {
    if (!noteId) return
    
    const { error } = await supabase
      .from('notes')
      .update({ content })
      .eq('id', noteId)

    if (error) {
      console.error('Error saving note content:', error)
    }
  }

  const handleQuiz = async () => {
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      const questions = await response.json()
      setQuestions(questions)
      setIsQuizOpen(true)
    } catch (error) {
      console.error('Error generating quiz:', error)
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
      subscribeToChanges()
      return () => {
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel)
        }
      }
    } else {
      setTitle('')
      setContent('')
      setIsEditing(false)
    }
  }, [noteId, supabase])

  const subscribeToChanges = () => {
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
          // Only update if the change came from a different client
          if (payload.new.content !== content) {
            setContent(payload.new.content)
            loadStoreContent(noteId, payload.new.content)
          }
        }
      )
      .subscribe()

    setRealtimeChannel(channel)
  }

  const loadNote = async () => {
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
      setContent(data.content || '')
      loadStoreContent(noteId, data.content || '')
    }
  }

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

  const handlePhraseClick = useCallback(async (phrase: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase, language: 'it' }), // Default to Italian
      })
      
      const { audio } = await response.json()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(
        Buffer.from(audio, 'base64').buffer
      )
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }, [])

  const highlightForTranslation = useCallback((selectedText: string) => {
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
  }, [content, noteId, setStoreContent])
  const renderMarkdown = useCallback((text: string) => {
    return text.replace(/`([^`]+)`/g, (_, phrase) => {
      return `<span class="cursor-pointer text-primary hover:underline" onclick="handlePhraseClick('${phrase}')">\`${phrase}\`</span>`
    })
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
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300"
              onClick={handleQuiz}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Quiz Me
            </Button>
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
      <div className="flex-1 p-4 overflow-y-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full p-2 border rounded-md bg-background"
            value={content}
            onChange={(e) => {
              const newContent = e.target.value
              setContent(newContent)
              setStoreContent(noteId, newContent)
              // Debounce save to Supabase
              debounce(() => saveNoteContent(newContent), 1000)()
            }}
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
        />
      </div>
    </div>
  )
}