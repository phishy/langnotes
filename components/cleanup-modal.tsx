import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { ChatInput } from './chat-input'

interface CleanupModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onCleanup: (cleanedContent: string) => void
}

export function CleanupModal({ isOpen, onClose, content, onCleanup }: CleanupModalProps) {
  const [prompt, setPrompt] = useState('Clean up formatting and fix any errors while preserving the meaning.')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, prompt })
      })

      if (!res.ok) {
        throw new Error('Failed to clean up content')
      }

      const { cleanContent } = await res.json()
      onCleanup(cleanContent)
      onClose()
    } catch (error) {
      console.error('Error cleaning up content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Clean Up Note</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ChatInput
            value={prompt}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onTranscription={setPrompt}
            setValue={setPrompt}
            isLoading={isLoading}
            placeholder="How would you like the note to be cleaned up?"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
