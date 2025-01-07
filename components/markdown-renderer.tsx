import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu'
import { useState, useCallback } from 'react'

interface MarkdownRendererProps {
  content: string
  onHighlight?: (text: string) => void
  showContextMenu?: boolean
  className?: string
}

export function MarkdownRenderer({
  content,
  onHighlight,
  showContextMenu = false,
  className = ''
}: MarkdownRendererProps) {
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null)

  const handlePhraseClick = useCallback(async (phrase: string) => {
    try {
      setPlayingPhrase(phrase)
      const audio = new Audio(`/api/speech?text=${encodeURIComponent(phrase)}&language=it`)
      audio.onended = () => setPlayingPhrase(null)
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingPhrase(null)
    }
  }, [])

  const renderPhrase = (phrase: string) => {
    const isPlaying = playingPhrase === phrase
    return (
      <button
        className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 focus:outline-none"
        data-phrase={phrase}
      >
        <code>{phrase}</code>
        <span className="inline-flex items-center justify-center w-4 h-4">
          {isPlaying ? <span className="animate-pulse">🔊</span> : '🔈'}
        </span>
      </button>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    const button = (e.target as HTMLElement).closest('button[data-phrase]')
    if (button) {
      const phrase = button.getAttribute('data-phrase')
      if (phrase) {
        handlePhraseClick(phrase)
      }
    }
  }

  const baseClassName = 'prose prose-sm max-w-none prose-invert ai-markdown [&_table]:border-collapse [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_tr]:even:bg-muted/25'
  const finalClassName = `${baseClassName} ${className}`

  const markdown = (
    <div className={finalClassName} onClick={handleClick}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ children }) => renderPhrase(children as string)
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )

  if (!showContextMenu) return markdown

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {markdown}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            const selectedText = window.getSelection()?.toString() || ''
            if (selectedText.trim() && onHighlight) {
              onHighlight(selectedText)
            }
          }}
        >
          Highlight for Translation
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
