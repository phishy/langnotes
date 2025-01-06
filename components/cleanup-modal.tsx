import { useState, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Loader2 } from 'lucide-react'

interface CleanupModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onCleanup: (cleanedContent: string) => void
}

export function CleanupModal({ isOpen, onClose, content, onCleanup }: CleanupModalProps) {
  const [prompt, setPrompt] = useState('Clean up formatting and fix any errors while preserving the meaning.')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Clean Up Note</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="How would you like the note to be cleaned up?"
            value={prompt}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cleaning...
              </>
            ) : (
              'Clean Up'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
