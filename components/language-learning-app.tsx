"use client"

import { useState } from 'react'
import { FolderList } from './folder-list'
import { NoteList } from './note-list'
import { NoteEditor } from './note-editor'
import { AIChat } from './ai-chat'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'

export function LanguageLearningApp() {
  const [showFolders, setShowFolders] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [noteVersion, setNoteVersion] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [activeView, setActiveView] = useState<'folders' | 'notes' | 'editor' | 'chat'>('editor')

  const handleNoteUpdated = () => {
    setNoteVersion(v => v + 1)
  }

  const handleStartEditing = () => {
    setIsEditing(true)
  }

  const isMobileView = () => {
    return typeof window !== 'undefined' && window.innerWidth < 768
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Navigation */}
      <div className="md:hidden border-b p-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveView('folders')}
          className={activeView === 'folders' ? 'text-purple-400' : ''}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView('notes')}
            className={activeView === 'notes' ? 'text-purple-400' : ''}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView('editor')}
            className={activeView === 'editor' ? 'text-purple-400' : ''}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView('chat')}
            className={activeView === 'chat' ? 'text-purple-400' : ''}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid md:grid-cols-[16rem_18rem_1fr_24rem] overflow-hidden">
        {/* Folders Column */}
        <div className={`transition-all duration-300 border-r overflow-hidden ${
          (!isMobileView() && showFolders) || (isMobileView() && activeView === 'folders')
            ? 'block'
            : 'hidden md:block md:w-0'
        }`}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 flex justify-between items-center">
              <h2 className="font-semibold">Folders</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFolders(!showFolders)}
                className="hidden md:inline-flex"
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
        <div className={`border-r ${
          (!isMobileView()) || (isMobileView() && activeView === 'notes')
            ? 'block'
            : 'hidden'
        }`}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 flex justify-between items-center">
              <h2 className="font-semibold">Notes</h2>
              {!showFolders && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFolders(true)}
                  className="hidden md:inline-flex"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            <NoteList
              folderId={selectedFolder}
              selectedNote={selectedNote}
              onSelectNote={(note) => {
                setSelectedNote(note)
                if (isMobileView()) {
                  setActiveView('editor')
                }
              }}
              onStartEditing={handleStartEditing}
            />
          </div>
        </div>

        {/* Note Editor Column */}
        <div className={`border-r ${
          (!isMobileView()) || (isMobileView() && activeView === 'editor')
            ? 'block'
            : 'hidden'
        }`}>
          <NoteEditor
            noteId={selectedNote}
            key={`${selectedNote}-${noteVersion}`}
            defaultIsEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        </div>

        {/* AI Chat Column */}
        <div className={
          (!isMobileView()) || (isMobileView() && activeView === 'chat')
            ? 'block'
            : 'hidden'
        }>
          <AIChat noteId={selectedNote} onNoteUpdated={handleNoteUpdated} />
        </div>
      </div>
    </div>
  )
}
