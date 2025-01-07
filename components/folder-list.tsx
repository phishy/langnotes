"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Folder, Plus, Pencil, Check, MoreVertical, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteConfirmation } from './delete-confirmation'

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
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
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

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderToDelete)

    if (error) {
      console.error('Error deleting folder:', error)
      return
    }

    setFolders(folders.filter(folder => folder.id !== folderToDelete))
    if (selectedFolder === folderToDelete) {
      const nextFolder = folders.find(folder => folder.id !== folderToDelete)
      if (nextFolder) {
        onSelectFolder(nextFolder.id)
      }
    }
    setFolderToDelete(null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Folders</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewFolder}
          className="text-purple-400 hover:text-purple-300"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
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
              {editingId === folder.id ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSaveEdit}
                >
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditFolder(folder.id)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFolderToDelete(folder.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      <DeleteConfirmation
        isOpen={folderToDelete !== null}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        description="Are you sure you want to delete this folder? All notes in this folder will also be deleted. This action cannot be undone."
      />
    </div>
  )
}
