"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Folder, Plus, Pencil, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface FolderListProps {
  selectedFolder: string | null
  onSelectFolder: (folderId: string) => void
}

interface FolderType {
  id: string
  name: string
}

export function FolderList({ selectedFolder, onSelectFolder }: FolderListProps) {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching folders:', error)
      return
    }

    setFolders(data || [])
  }

  const handleNewFolder = async () => {
    const name = prompt('Enter folder name:')
    if (!name) return

    const { data, error } = await supabase
      .from('folders')
      .insert([{ name }])
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      return
    }

    if (data) {
      setFolders([...folders, data])
      onSelectFolder(data.id)
    }
  }

  const handleEditFolder = async (id: string) => {
    const folder = folders.find(f => f.id === id)
    if (folder) {
      setEditingId(id)
      setEditingName(folder.name)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return

    const { error } = await supabase
      .from('folders')
      .update({ name: editingName.trim() })
      .eq('id', editingId)

    if (error) {
      console.error('Error updating folder:', error)
      return
    }

    setFolders(folders.map(folder => 
      folder.id === editingId 
        ? { ...folder, name: editingName.trim() }
        : folder
    ))
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="space-y-2 p-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center gap-2"
        >
          <Button
            variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
            className="flex-1 justify-start"
            onClick={() => onSelectFolder(folder.id)}
          >
            <Folder className="mr-2 h-4 w-4" />
            {editingId === folder.id ? (
              <input
                className="bg-transparent border-none focus:outline-none flex-1"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  } else if (e.key === 'Escape') {
                    setEditingId(null)
                    setEditingName('')
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              folder.name
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (editingId === folder.id) {
                handleSaveEdit()
              } else {
                handleEditFolder(folder.id)
              }
            }}
          >
            {editingId === folder.id ? (
              <Check className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
      <Button variant="ghost" className="w-full justify-start" onClick={handleNewFolder}>
        <Plus className="mr-2 h-4 w-4" />
        New Folder
      </Button>
    </div>
  )
}