"use client"

import { useState } from 'react'
import { FolderList } from './folder-list'
import { NoteList } from './note-list'
import { NoteEditor } from './note-editor'
import { AIChat } from './ai-chat'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function LanguageLearningApp() {
  const [showFolders, setShowFolders] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [noteVersion, setNoteVersion] = useState(0)

  const handleNoteUpdated = () => {
    setNoteVersion(v => v + 1)
  }

  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: `${showFolders ? '16rem' : '0'} 18rem 1fr 24rem` }}>
      {/* Folders Column */}
      <div className="transition-all duration-300 border-r overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-4 flex justify-between items-center">
            <h2 className="font-semibold">Folders</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFolders(!showFolders)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <FolderList
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
        </div>
      </div>

      {/* Notes List Column */}
      <div className="border-r">
        <div className="h-full overflow-y-auto">
          <div className="p-4 flex justify-between items-center">
            <h2 className="font-semibold">Notes</h2>
            {!showFolders && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFolders(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <NoteList
            folderId={selectedFolder}
            selectedNote={selectedNote}
            onSelectNote={setSelectedNote}
          />
        </div>
      </div>

      {/* Note Editor Column */}
      <div className="border-r">
        <NoteEditor noteId={selectedNote} key={`${selectedNote}-${noteVersion}`} />
      </div>

      {/* AI Chat Column */}
      <div>
        <AIChat noteId={selectedNote} onNoteUpdated={handleNoteUpdated} />
      </div>
    </div>
  )
}