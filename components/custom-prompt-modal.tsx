import { useState, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { VoiceRecorder } from './voice-recorder'

interface CustomPromptModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
}

export function CustomPromptModal({ isOpen, onClose, content }: CustomPromptModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      onClose()
      setPrompt('')
      setResponse('')
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ask AI About This Note</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
            <div className="mt-4 p-4 rounded-md bg-muted">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
