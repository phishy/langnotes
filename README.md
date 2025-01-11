# LangNotes

LangNotes is an AI-powered language learning platform that helps you learn Italian through interactive conversations, vocabulary tracking, and smart quizzes.

## Features

- 🤖 **AI Chat**: Have natural conversations in Italian with a context-aware AI tutor
- 📝 **Smart Notes**: Take notes with inline pronunciation and translation
- 📚 **Vocabulary Tracking**: Automatically save and review words you encounter
- 🎯 **Interactive Quizzes**: Test your knowledge with AI-generated quizzes
- 🗣️ **Text-to-Speech**: Listen to native Italian pronunciation
- 🔄 **Voice Input**: Practice speaking with voice recognition
- 📱 **Mobile-First**: Fully responsive design with PWA support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **Speech**: ElevenLabs Text-to-Speech
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/langnotes.git
cd langnotes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- `notes`: User's language learning notes
- `words`: Italian vocabulary words
- `vocabularies`: User-word associations
- `searches`: Chat history and structured data
- `quizzes`: Generated quiz questions and answers

## API Routes

- `/api/search`: AI chat endpoint with structured data extraction
- `/api/speech`: Text-to-speech synthesis with ElevenLabs
- `/api/transcribe`: Voice input transcription
- `/api/quiz`: AI quiz generation
- `/api/word-details`: Word details and example sentences

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for GPT-4 API
- [ElevenLabs](https://elevenlabs.io/) for text-to-speech
- [Supabase](https://supabase.com/) for database and auth
- [Vercel](https://vercel.com/) for hosting
- [shadcn/ui](https://ui.shadcn.com/) for UI components
