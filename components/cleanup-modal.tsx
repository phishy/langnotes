import { useState, ChangeEvent, useEffect, useRef } from 'react'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Need to wait for the modal transition to complete
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
        // Need another small delay after focus for selection to work reliably
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(0, textareaRef.current.value.length)
        }, 50)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

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
          <DialogTitle className="text-purple-400">Clean Up Note</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Textarea
            ref={textareaRef}
            placeholder="How would you like the note to be cleaned up?"
            value={prompt}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            className="min-h-[100px]"
            onFocus={(e) => e.target.setSelectionRange(0, e.target.value.length)}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="bg-purple border-purple-600 border text-white"
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
