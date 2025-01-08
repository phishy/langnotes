import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ folderId: string }>
}

export default async function FolderPage({
  params
}: PageProps) {
  const { folderId } = await params

  // If no folder selected, render the app
  if (folderId === '_') {
    redirect('/app/notes/_/_')
  }

  const supabase = await createClient()

  // Get the first note in the folder
  const { data: notes } = await supabase
    .from('notes')
    .select('id')
    .eq('folder_id', folderId)
    .order('position', { ascending: true })
    .limit(1)

  // If there's a note, redirect to it
  if (notes && notes.length > 0) {
    redirect(`/app/notes/${folderId}/${notes[0].id}`)
  }

  // Otherwise, show the folder without a selected note
  redirect(`/app/notes/${folderId}/_`)
}
