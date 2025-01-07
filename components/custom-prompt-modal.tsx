import { useState, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Loader2, Plus } from 'lucide-react'
import { VoiceRecorder } from './voice-recorder'
import { MarkdownRenderer } from './markdown-renderer'

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

  const handleSubmit = async () => {
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

  const handleTranscription = (text: string) => {
    setPrompt(text)
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
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask any question about this note..."
              value={prompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <VoiceRecorder onTranscription={handleTranscription} />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="bg-purple border-purple-600 border text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              'Ask AI'
            )}
          </Button>
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
