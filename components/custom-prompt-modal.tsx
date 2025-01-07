import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { MarkdownRenderer } from './markdown-renderer'
import { ChatInput } from './chat-input'

interface CustomPromptModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onAddToNote?: (text: string) => void
}

export function CustomPromptModal({ isOpen, onClose, content, onAddToNote }: CustomPromptModalProps) {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/custom-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, content })
      })

      if (!res.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await res.json()
      setResponse(data.response)
    } catch (error) {
      console.error('Error getting AI response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
  }

  const handleAddToNote = () => {
    if (response && onAddToNote) {
      onAddToNote(response)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      onClose()
      setPrompt('')
      setResponse('')
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-purple-400">What do you want to know?</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          <ChatInput
            value={prompt}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onTranscription={setPrompt}
            setValue={setPrompt}
            isLoading={isLoading}
            placeholder="Ask any question about this note..."
          />
          {response && (
            <div className="mt-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <MarkdownRenderer content={response} />
              </div>
              <Button
                variant="ghost"
                className="text-purple-300 hover:text-purple-200 hover:bg-purple-900/20 self-end"
                onClick={handleAddToNote}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Note
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
