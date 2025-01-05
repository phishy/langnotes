import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FloatingPhrases } from './floating-phrases';

export function Hero() {
  return (
    <div className="relative min-h-[600px] py-24 px-4 text-center overflow-hidden">
      <FloatingPhrases />
      <h1 className="relative text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
        Master Languages
      </h1>
      <h2 className="relative text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white text-transparent bg-clip-text">
        with AI-Powered Notes
      </h2>
      <p className="relative text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Transform your language learning journey with intelligent note-taking,
        real-time translations, and AI-powered conversation practice.
      </p>
      <div className="relative flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/sign-up">Start Learning for Free</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="#features">Learn More</Link>
        </Button>
      </div>
    </div>
  )
}
