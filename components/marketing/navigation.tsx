"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface NavigationProps {
  user: User | null
}

export function Navigation({ user }: NavigationProps) {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold text-purple-500 hover:text-purple-400 transition-colors">
            LangNotes
          </Link>
        </div>
        <div className="flex gap-4">
          {user ? (
            <Button asChild>
              <Link href="/app">Open App</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
