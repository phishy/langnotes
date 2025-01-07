import { useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ArrowUp } from 'lucide-react'
import { VoiceRecorder } from './voice-recorder'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onTranscription: (text: string) => void
  setValue: (text: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onTranscription,
  setValue,
  isLoading = false,
  placeholder = "Ask about language learning..."
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to allow scrollHeight to shrink if needed
    textarea.style.height = 'auto'
    // Set the height to scrollHeight to expand based on content
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  // Custom onChange handler to adjust height
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e)
    // Use requestAnimationFrame to ensure the value has been updated
    requestAnimationFrame(adjustTextareaHeight)
  }

  // Handle transcription with auto-resize
  const handleTranscription = (text: string) => {
    setValue(text)
    // Use requestAnimationFrame to ensure the value has been updated
    requestAnimationFrame(adjustTextareaHeight)
  }

  // Adjust height on initial render and when value changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [value, adjustTextareaHeight])

  return (
    <form onSubmit={onSubmit} className="p-4 border-t mt-auto">
      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          className="min-h-[60px] resize-none overflow-hidden"
          rows={1}
        />
        <div className="flex justify-end gap-2">
          <VoiceRecorder onTranscription={handleTranscription} />
          <Button type="submit" className="text-purple-400 hover:text-purple-300 px-4 bg-black">
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  )
}
