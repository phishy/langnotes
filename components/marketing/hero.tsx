import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FloatingPhrases } from './floating-phrases';

export function Hero() {
  return (
    <div className="relative min-h-[600px] py-24 px-4 text-center overflow-hidden">
      <FloatingPhrases />
      <h1 className="relative text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text p-1">
        Learn Languages
      </h1>
      <h2 className="relative text-2xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-white to-white text-transparent bg-clip-text p-1">
        AI for Beginners and Experts
      </h2>
      <p className="relative text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Transform your language learning journey with intelligent note-taking,
        real-time translations, and AI-powered conversation practice.
      </p>
      <div className="relative flex gap-4 justify-center">
        <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-500 text-white">
          <Link href="/sign-up">Start Learning for Free</Link>
        </Button>
        {/* <Button asChild size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600/10">
          <Link href="#features">Learn More</Link>
        </Button> */}
      </div>
    </div>
  )
}
