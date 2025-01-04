"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface NoteListProps {
  folderId: string | null
  selectedNote: string | null
  onSelectNote: (noteId: string) => void
}

interface Note {
  id: string
  title: string
  content: string
  folder_id: string
}

export function NoteList({ folderId, selectedNote, onSelectNote }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (folderId) {
      fetchNotes()

      // Subscribe to note changes
      const channel = supabase
        .channel('notes_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `folder_id=eq.${folderId}`
          },
          () => {
            fetchNotes()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [folderId, supabase])

  const fetchNotes = async () => {
    if (!folderId) return
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return
    }

    setNotes(data || [])
  }

  const handleNewNote = async () => {
    if (!folderId) return

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title: 'New Note',
          content: '',
          folder_id: folderId
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return
    }

    if (data) {
      setNotes([data, ...notes])
      onSelectNote(data.id)
    }
  }

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this note?')) return

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting note:', error)
      return
    }

    setNotes(notes.filter(note => note.id !== noteId))
    if (selectedNote === noteId) {
      onSelectNote(notes[0]?.id || null)
    }
  }

  return (
    <div className="space-y-2 p-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex items-center gap-2"
        >
          <Button
            variant={selectedNote === note.id ? 'secondary' : 'ghost'}
            className="flex-1 justify-start flex-col items-start"
            onClick={() => onSelectNote(note.id)}
          >
            <div className="flex items-center w-full">
              <FileText className="mr-2 h-4 w-4" />
              {note.title}
            </div>
            {/* <p className="text-xs text-muted-foreground truncate w-full text-left pl-6">
              {note.content || 'Empty note...'}
            </p> */}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleDeleteNote(note.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" className="w-full justify-start" onClick={handleNewNote} disabled={!folderId}>
        <Plus className="mr-2 h-4 w-4" />
        New Note
      </Button>
    </div>
  )
}
