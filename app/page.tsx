import { createClient } from '@/utils/supabase/server';
import { Features } from '@/components/marketing/features';
import { Hero } from '@/components/marketing/hero';
import { Navigation } from '@/components/marketing/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation user={user} />

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
