import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/utils/supabase/client'

interface HistoryState {
  past: string[]
  present: string
  future: string[]
}

interface NoteHistories {
  [noteId: string]: HistoryState
}

interface NoteState {
  histories: NoteHistories
  currentNoteId: string | null
  canUndo: boolean
  canRedo: boolean
  loadContent: (noteId: string, content: string) => void
  setContent: (noteId: string, content: string) => void
  undo: () => void
  redo: () => void
  getCurrentContent: () => string
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      histories: {},
      currentNoteId: null,
      canUndo: false,
      canRedo: false,

      saveToSupabase: async (noteId: string, content: string) => {
        const supabase = createClient()
        const { error } = await supabase
          .from('notes')
          .update({ content })
          .eq('id', noteId)

        if (error) {
          console.error('Error saving note to Supabase:', error)
        }
      },

      loadContent: (noteId, content) => {
        set((state) => {
          // If the note already exists and has the same content, just update the currentNoteId
          if (state.histories[noteId]?.present === content) {
            return {
              currentNoteId: noteId,
              canUndo: state.histories[noteId]?.past.length > 0,
              canRedo: state.histories[noteId]?.future.length > 0
            }
          }

          // Otherwise, initialize or reset the history
          return {
            histories: {
              ...state.histories,
              [noteId]: {
                past: [],
                present: content,
                future: []
              }
            },
            currentNoteId: noteId,
            canUndo: false,
            canRedo: false
          }
        })
      },

      setContent: (noteId, content) => {
        const state = get()
        const history = state.histories[noteId]

        // If no history exists or content hasn't changed, do nothing
        if (!history || content === history.present) return

        set((state) => ({
          histories: {
            ...state.histories,
            [noteId]: {
              past: [...history.past, history.present],
              present: content,
              future: []
            }
          },
          canUndo: true,
          canRedo: false
        }))
      },

      undo: () => {
        const state = get()
        const noteId = state.currentNoteId
        if (!noteId) return

        const history = state.histories[noteId]
        if (!history || history.past.length === 0) return

        const previous = history.past[history.past.length - 1]
        const newPast = history.past.slice(0, history.past.length - 1)

        set((state) => ({
          histories: {
            ...state.histories,
            [noteId]: {
              past: newPast,
              present: previous,
              future: [history.present, ...history.future]
            }
          },
          canUndo: newPast.length > 0,
          canRedo: true
        }))
      },

      redo: () => {
        const state = get()
        const noteId = state.currentNoteId
        if (!noteId) return

        const history = state.histories[noteId]
        if (!history || history.future.length === 0) return

        const next = history.future[0]
        const newFuture = history.future.slice(1)

        set((state) => ({
          histories: {
            ...state.histories,
            [noteId]: {
              past: [...history.past, history.present],
              present: next,
              future: newFuture
            }
          },
          canUndo: true,
          canRedo: newFuture.length > 0
        }))
      },

      getCurrentContent: () => {
        const state = get()
        const noteId = state.currentNoteId
        if (!noteId) return ''
        return state.histories[noteId]?.present || ''
      }
    }),
    {
      name: 'note-history',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        histories: state.histories,
        currentNoteId: state.currentNoteId
      })
    }
  )
)
