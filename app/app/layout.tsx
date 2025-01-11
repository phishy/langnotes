"use client"
import Link from "next/link"
import { Home, Bot, Book, Brain, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/app",
    icon: Bot,
    label: "AI",
  },
  {
    href: "/app/words",
    icon: Book,
    label: "Words",
  },
  {
    href: "/app/quiz",
    icon: Brain,
    label: "Quiz",
  },
  {
    href: "/app/notes",
    icon: FileText,
    label: "Notes",
  },
  {
    href: "/app/profile",
    icon: User,
    label: "Profile",
  },
]

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/app/notes') {
      return pathname.startsWith('/app/notes')
    }
    return pathname === href
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="pb-16">{children}</div>
      </main>

      <nav className="fixed bottom-0 mb-10 left-0 right-0 h-16 border-t bg-background">
        <div className="flex justify-around h-full">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[60px]",
                  active
                    ? "text-purple-500"
                    : "text-muted-foreground hover:text-purple-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
