"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { FileText, Plus, Trash2, Search, GripVertical } from 'lucide-react'
import { DeleteConfirmation } from './delete-confirmation'
import { createClient } from '@/utils/supabase/client'
import { Input } from './ui/input'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface NoteListProps {
  folderId: string | null
  selectedNote: string | null
  onSelectNote: (noteId: string | null) => void
  onStartEditing?: () => void
}

interface Note {
  id: string
  title: string
  content: string
  position: number
}

interface SortableNoteProps {
  note: Note
  selectedNote: string | null
  onSelectNote: (noteId: string) => void
  onDelete: (noteId: string, e: React.MouseEvent) => void
}

function SortableNote({ note, selectedNote, onSelectNote, onDelete }: SortableNoteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-purple-400 p-2"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Button
        variant={selectedNote === note.id ? 'secondary' : 'ghost'}
        className="flex-1 justify-start flex-col items-start"
        onClick={() => onSelectNote(note.id)}
      >
        <div className="flex items-center w-full">
          <FileText className="mr-2 h-4 w-4" />
          {note.title}
        </div>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => onDelete(note.id, e)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function NoteList({ folderId, selectedNote, onSelectNote, onStartEditing }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredNotes(notes.filter(note =>
        note.title.toLowerCase().includes(query)
      ))
    }
  }, [searchQuery, notes])

  const fetchNotes = async () => {
    if (!folderId) return
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching notes:', error)
      return
    }

    setNotes(data || [])
  }

  const handleNewNote = async () => {
    if (!folderId) return

    // Get the highest position
    const maxPosition = notes.reduce((max, note) => Math.max(max, note.position || 0), 0)

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title: 'New Note',
          content: '',
          folder_id: folderId,
          position: maxPosition + 1
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
      onStartEditing?.()
    }
  }

  const handleDeleteClick = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNoteToDelete(noteId)
  }

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteToDelete)

    if (error) {
      console.error('Error deleting note:', error)
      return
    }

    setNotes(notes.filter(note => note.id !== noteToDelete))
    if (selectedNote === noteToDelete) {
      const nextNote = notes.find(note => note.id !== noteToDelete)
      onSelectNote(nextNote?.id || null)
    }
    setNoteToDelete(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = notes.findIndex(note => note.id === active.id)
    const newIndex = notes.findIndex(note => note.id === over.id)

    const newNotes = arrayMove(notes, oldIndex, newIndex)
    setNotes(newNotes)

    // Update positions in Supabase
    const updates = newNotes.map((note, index) => ({
      id: note.id,
      position: index
    }))

    const { error } = await supabase
      .from('notes')
      .upsert(updates, { onConflict: 'id' })

    if (error) {
      console.error('Error updating note positions:', error)
      // Revert the state if there was an error
      setNotes(notes)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-2">
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewNote}
          className="text-purple-400 hover:text-purple-300"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={Array.from(filteredNotes, note => note.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <SortableNote
                  key={note.id}
                  note={note}
                  selectedNote={selectedNote}
                  onSelectNote={onSelectNote}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <DeleteConfirmation
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
      />
    </div>
  )
}
