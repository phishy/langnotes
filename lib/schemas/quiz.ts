import { z } from 'zod';

export const QuizQuestion = z.object({
  question: z.string(),
  answer: z.string(),
  options: z.array(z.string()).length(4),
});

export const QuizResponse = z.array(QuizQuestion).length(5);

export type QuizQuestion = z.infer<typeof QuizQuestion>;
export type QuizResponse = z.infer<typeof QuizResponse>;
