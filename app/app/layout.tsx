import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-500 hover:text-purple-400 transition-colors">
            LangNotes
          </Link>
          <form action={signOutAction}>
            <Button variant="ghost">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
