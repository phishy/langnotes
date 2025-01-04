import { createClient } from '@/utils/supabase/server'

export async function getNotes(folderId: string) {
  const supabase = await createClient()
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('folder_id', folderId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return notes
}

export async function getNote(id: string) {
  const supabase = await createClient()
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return note
}

export async function createNote(title: string, content: string, folderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, content, folder_id: folderId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(id: string, title: string, content: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update({ title, content })
    .match({ id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notes')
    .delete()
    .match({ id })

  if (error) throw error
}