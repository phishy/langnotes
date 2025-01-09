import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/sign-in')
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-foreground">{user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Account Created</label>
            <p className="text-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="destructive"
              className="w-full mt-6"
            >
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
