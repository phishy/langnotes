"use client"

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import ReactMarkdown from 'react-markdown'
import { useCallback } from 'react'

interface AIChatProps {
  noteId: string | null
  onNoteUpdated?: () => void
}

export function AIChat({ noteId, onNoteUpdated }: AIChatProps) {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 prose prose-sm max-w-none bg-black">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-black prose prose-sm max-w-none ai-markdown'
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about language learning..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}