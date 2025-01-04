"use client"

import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from './ui/button'
import { Pencil, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface NoteEditorProps {
  noteId: string | null
}

interface Note {
  id: string
  title: string
  content: string
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (noteId) {
      loadNote()
    } else {
      setTitle('')
      setContent('')
    }
  }, [noteId])

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
    }
  }

  const saveNote = async () => {
    if (!noteId) return
    setIsSaving(true)

    const { error } = await supabase
      .from('notes')
      .update({ title, content })
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
          <h2 className="font-semibold">{title}</h2>
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
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
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
        )}
      </div>
    </div>
  )
}