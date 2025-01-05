"use client"

import { useState, useEffect } from 'react'
import { FolderList } from './folder-list'
import { NoteList } from './note-list'
import { NoteEditor } from './note-editor'
import { AIChat } from './ai-chat'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, Menu, X, Folder, FileText, Bot } from 'lucide-react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from "react-resizable-panels"
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function LanguageLearningApp() {
  const [showFolders, setShowFolders] = useState(true)
  const [noteVersion, setNoteVersion] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [activeView, setActiveView] = useState<'folders' | 'notes' | 'editor' | 'chat'>('folders')
  const [isMobile, setIsMobile] = useState(false)

  const params = useParams()
  const router = useRouter()

  const selectedFolder = params?.folderId as string
  const selectedNote = params?.noteId as string

  // Set initial view based on route
  useEffect(() => {
    if (isMobile) {
      if (selectedNote && selectedNote !== '_') {
        setActiveView('editor')
      } else if (selectedFolder && selectedFolder !== '_') {
        setActiveView('notes')
      } else {
        setActiveView('folders')
      }
    }
  }, [isMobile, selectedFolder, selectedNote])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update active view when a note is selected in mobile mode
  useEffect(() => {
    if (isMobile && selectedNote && selectedNote !== '_') {
      setActiveView('editor')
    }
  }, [isMobile, selectedNote])

  const handleSelectFolder = (folderId: string) => {
    router.push(`/protected/app/${folderId}`)
    if (isMobile) {
      setActiveView('notes')
    }
  }

  const handleSelectNote = (noteId: string | null) => {
    router.push(`/protected/app/${selectedFolder}/${noteId || '_'}`)
    if (isMobile) {
      setActiveView('editor')
    }
  }

  const handleNoteUpdated = () => {
    setNoteVersion(v => v + 1)
  }

  const handleStartEditing = () => {
    setIsEditing(true)
  }

  const ResizeHandle = () => {
    return (
      <PanelResizeHandle className="w-1 hover:w-2 bg-border hover:bg-purple-500 transition-all duration-150 relative">
        <div className="absolute inset-y-0 -right-1 -left-1 cursor-col-resize" />
      </PanelResizeHandle>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Folders Column */}
          {(!isMobile && showFolders) || (isMobile && activeView === 'folders') ? (
            <>
              <Panel defaultSize={15} minSize={10}>
                <div className="h-full border-r overflow-hidden">
                  <div className="h-full overflow-y-auto pb-16 md:pb-0">
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
                      selectedFolder={selectedFolder === '_' ? null : selectedFolder}
                      onSelectFolder={handleSelectFolder}
                    />
                  </div>
                </div>
              </Panel>
              {!isMobile && <ResizeHandle />}
            </>
          ) : null}

          {/* Notes List Column */}
          {(!isMobile || activeView === 'notes') && (
            <>
              <Panel defaultSize={20} minSize={15}>
                <div className="h-full border-r overflow-hidden">
                  <div className="h-full overflow-y-auto pb-16 md:pb-0">
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
                      folderId={selectedFolder === '_' ? null : selectedFolder}
                      selectedNote={selectedNote === '_' ? null : selectedNote}
                      onSelectNote={handleSelectNote}
                      onStartEditing={handleStartEditing}
                    />
                  </div>
                </div>
              </Panel>
              {!isMobile && <ResizeHandle />}
            </>
          )}

          {/* Editor Column */}
          {(!isMobile || activeView === 'editor') && (
            <Panel>
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto pb-16 md:pb-0">
                  <NoteEditor
                    key={noteVersion}
                    noteId={selectedNote === '_' ? null : selectedNote}
                    defaultIsEditing={isEditing}
                    onEditingChange={setIsEditing}
                  />
                </div>
              </div>
            </Panel>
          )}

          {/* AI Chat Column */}
          {!isMobile && <ResizeHandle />}
          <Panel defaultSize={25} minSize={20} className={cn(
            isMobile && activeView !== 'chat' && 'hidden'
          )}>
            <div className="h-full border-l overflow-hidden">
              <div className="h-full overflow-y-auto pb-16 md:pb-0">
                <AIChat noteId={selectedNote === '_' ? null : selectedNote} />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex justify-around items-center p-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setActiveView('folders')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2 hover:bg-transparent hover:text-purple-500",
              activeView === 'folders' ? "text-purple-500" : "text-muted-foreground"
            )}
          >
            <Folder className="h-5 w-5" />
            <span className="text-xs">Folders</span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setActiveView('notes')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2 hover:bg-transparent hover:text-purple-500",
              (activeView === 'notes' || activeView === 'editor') ? "text-purple-500" : "text-muted-foreground"
            )}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Notes</span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setActiveView('chat')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2 hover:bg-transparent hover:text-purple-500",
              activeView === 'chat' ? "text-purple-500" : "text-muted-foreground"
            )}
          >
            <Bot className="h-5 w-5" />
            <span className="text-xs">AI</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
