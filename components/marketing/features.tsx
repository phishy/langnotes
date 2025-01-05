import { Bot, BookOpen, Mic, Globe, Brain } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Smart Note Organization',
    description: 'Organize your language learning notes with folders and smart categorization.'
  },
  {
    icon: Brain,
    title: 'Instant Quizzes',
    description: 'Generate AI-powered quizzes from your notes to test your knowledge and reinforce learning.'
  },
  {
    icon: Bot,
    title: 'AI Language Assistant',
    description: 'Get instant help with grammar, vocabulary, and pronunciation from our AI tutor.'
  },
  {
    icon: Mic,
    title: 'Text-to-Speech',
    description: 'Hear native pronunciations of words and phrases with a single click.'
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description: 'Learn multiple languages simultaneously with dedicated workspaces for each.'
  }
];

export function Features() {
  return (
    <div id="features" className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
          Everything You Need to Master a Language
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-lg bg-background border flex flex-col items-center text-center">
              <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-purple-600">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
