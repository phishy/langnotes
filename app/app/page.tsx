"use client"

import { useState } from 'react'
import { useChat } from 'ai/react'
import { ChatInput } from '@/components/chat-input'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function SearchPage() {
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, setInput, error } = useChat({
    api: '/api/search',
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('An error occurred while processing your request')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      await handleChatSubmit(e)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('An error occurred while sending your message')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="space-y-4 p-4">
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
                    : 'text-foreground p-3'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_table]:border-collapse [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_tr]:even:bg-muted/25">
                    <MarkdownRenderer content={message.content} />
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-none">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onTranscription={setInput}
          setValue={setInput}
        />
      </div>
    </div>
  )
}
