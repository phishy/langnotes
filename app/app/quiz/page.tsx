"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  question: string
  correctAnswer: string
  options: string[]
  explanation: string
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    loadQuiz()
  }, [])

  async function loadQuiz() {
    try {
      setLoading(true)
      const response = await fetch('/api/quiz')
      if (!response.ok) throw new Error('Failed to load quiz')
      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(answer: string) {
    setSelectedAnswer(answer)
    setShowExplanation(true)
    if (answer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  function handleRestart() {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    loadQuiz()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4 text-center">
        <p className="text-muted-foreground">No words available for quiz.</p>
        <p className="text-sm text-muted-foreground">Save some words first by chatting with the AI about Italian.</p>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="text-sm text-muted-foreground">
          Score: {score}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-invert prose-sm max-w-none mb-6">
          <MarkdownRenderer content={question.question} />
        </div>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isCorrect = option === question.correctAnswer
            const isSelected = option === selectedAnswer
            return (
              <Button
                key={option}
                variant="outline"
                className={cn(
                  "w-full justify-start h-auto py-3 px-4",
                  selectedAnswer && isCorrect && "border-green-500 text-green-500",
                  selectedAnswer && isSelected && !isCorrect && "border-red-500 text-red-500"
                )}
                onClick={() => !selectedAnswer && handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </Button>
            )
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 p-4 rounded-lg bg-muted">
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={question.explanation} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-4">
        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            Next Question
          </Button>
        ) : selectedAnswer ? (
          <Button onClick={handleRestart}>
            Try Again
          </Button>
        ) : null}
      </div>
    </div>
  )
}
