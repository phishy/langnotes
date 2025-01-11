"use client"

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { ChatInput } from '@/components/chat-input'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function SearchPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, setInput, error, isLoading } = useChat({
    api: '/api/search',
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('An error occurred while processing your request')
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      await handleChatSubmit(e)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('An error occurred while sending your message')
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="border-b flex-none">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Chat</h1>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20">
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
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="flex-none pb-[100px]">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onTranscription={setInput}
            setValue={setInput}
            isLoading={isLoading}
          />
        </div>
      </div>
      </div>
  )
}
