import { z } from 'zod'

export const SearchResponse = z.object({
  content: z.string(),
  words: z.array(z.object({
    word: z.string(),
    translation: z.string().optional(),
    type: z.string().optional()
  }))
})

export type SearchResponse = z.infer<typeof SearchResponse>
