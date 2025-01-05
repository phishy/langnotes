import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppPage() {
  const supabase = await createClient()

  // Get the first folder
  const { data: folders } = await supabase
    .from('folders')
    .select('id')
    .order('name', { ascending: true })
    .limit(1)

  // If there's a folder, redirect to it
  if (folders && folders.length > 0) {
    redirect(`/protected/app/${folders[0].id}`)
  }

  // Otherwise, just show the app without a selected folder
  redirect('/protected/app/_')
}
