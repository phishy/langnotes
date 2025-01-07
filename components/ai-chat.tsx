"use client"

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Plus, ArrowUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { MarkdownRenderer } from './markdown-renderer'
import { useCallback } from 'react'
import { VoiceRecorder } from './voice-recorder'

interface AIChatProps {
  noteId: string | null
  onNoteUpdated?: () => void
}

export function AIChat({ noteId, onNoteUpdated }: AIChatProps) {
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat()
  const supabase = createClient()

  const addToNote = useCallback(async (content: string) => {
    if (!noteId) return

    // First get the current note content
    const { data: note } = await supabase
      .from('notes')
      .select('content')
      .eq('id', noteId)
      .single()

    if (!note) return

    // Append the new content to the existing content
    const updatedContent = note.content
      ? `${note.content}\n\n${content}`
      : content

    // Update the note
    const { error } = await supabase
      .from('notes')
      .update({ content: updatedContent })
      .eq('id', noteId)

    if (error) {
      console.error('Error updating note:', error)
      return
    }

    // Trigger note refresh in the editor
    onNoteUpdated?.()
  }, [noteId, onNoteUpdated, supabase])

  const handleTranscription = (text: string) => {
    setInput(text)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary/10 text-primary p-3'
                  : 'text-foreground'
              }`}
            >
              <div className={message.role === 'assistant' ? 'prose prose-invert prose-sm max-w-none [&_table]:border-collapse [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_tr]:even:bg-muted/25' : ''}>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  message.content
                )}
              </div>
              {message.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
                  onClick={() => addToNote(message.content)}
                  disabled={!noteId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Note
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t mt-auto">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about language learning..."
          />
          <VoiceRecorder onTranscription={handleTranscription} />
          <Button type="submit" className="text-purple-400 hover:text-purple-300 px-4 bg-black">
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
