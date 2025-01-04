"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

interface Question {
  question: string
  answer: string
  options: string[]
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  questions: Question[]
}

export function QuizModal({ isOpen, onClose, questions }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    setIsCorrect(answer === questions[currentQuestion].answer)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } else {
      onClose()
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setIsCorrect(null)
    }
  }

  if (!questions.length) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz Time!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-lg mb-4">{questions[currentQuestion].question}</p>
          <div className="space-y-2">
            {questions[currentQuestion].options.map((option) => (
              <Button
                key={option}
                variant={selectedAnswer === option 
                  ? isCorrect 
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
            <div className="mt-4">
              <p className={`text-sm ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect. The correct answer is: ' + questions[currentQuestion].answer}
              </p>
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