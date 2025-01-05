import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Features } from '@/components/marketing/features';
import { Hero } from '@/components/marketing/hero';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
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

      <main className="flex-1">
        <Hero />
        <Features />
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          © 2025 LangNotes. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
