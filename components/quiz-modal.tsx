"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import type { QuizQuestion } from '@/lib/schemas/quiz'
import { MarkdownRenderer } from './markdown-renderer'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  questions: QuizQuestion[]
  content: string
}

export function QuizModal({ isOpen, onClose, questions, content }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    setIsCorrect(answer === questions[currentQuestion].answer)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setExplanation(null)
    } else {
      onClose()
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setExplanation(null)
    }
  }

  const handleExplanation = async () => {
    try {
      setIsLoadingExplanation(true)
      const response = await fetch('/api/quiz/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestion].question,
          answer: questions[currentQuestion].answer,
          content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get explanation')
      }

      const data = await response.json()
      setExplanation(data.explanation)
    } catch (error) {
      console.error('Error getting explanation:', error)
    } finally {
      setIsLoadingExplanation(false)
    }
  }

  if (!questions.length) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-purple-400">Quiz Time!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-lg mb-4">{questions[currentQuestion].question}</p>
          <div className="space-y-2">
            {questions[currentQuestion].options.map((option) => (
              <Button
                key={option}
                variant={selectedAnswer === option
                  ? option === questions[currentQuestion].answer
                    ? "default"
                    : "destructive"
                  : "outline"}
                className="w-full justify-start"
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </Button>
            ))}
          </div>
          {selectedAnswer && (
            <div className="mt-4 space-y-2">
              <p className={`text-sm ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect. The correct answer is: ' + questions[currentQuestion].answer}
              </p>
              {!explanation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExplanation}
                  disabled={isLoadingExplanation}
                  className="text-purple-400 hover:text-purple-300"
                >
                  {isLoadingExplanation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Why?'
                  )}
                </Button>
              )}
              {explanation && (
                <div className="text-sm mt-2 p-3 bg-muted rounded-md">
                  <MarkdownRenderer content={explanation} />
                </div>
              )}
              <Button
                className="mt-2"
                onClick={handleNext}
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
