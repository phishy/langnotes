import { createClient } from '@/utils/supabase/server'

export async function getFolders() {
  const supabase = await createClient()
  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return folders
}

export async function createFolder(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .insert([{ name }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFolder(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('folders')
    .delete()
    .match({ id })

  if (error) throw error
}