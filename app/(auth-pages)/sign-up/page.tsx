import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full sm:max-w-md bg-gray-900 p-8 rounded-lg shadow-lg">
          <FormMessage message={searchParams} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto min-h-screen flex flex-col md:flex-row">
        {/* First Column - Brand and Description (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center">
          <div className="max-w-md">
            <Link href="/" className="text-4xl font-bold text-purple-500 hover:text-purple-400 transition-colors">
              LangNotes
            </Link>
            <p className="text-gray-300 text-lg leading-relaxed mt-6">
              Join our community of language learners. Get started with AI-powered
              note-taking, progress tracking, and personalized learning paths designed
              to help you achieve fluency faster.
            </p>
          </div>
        </div>

        {/* Second Column - Signup Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <form className="bg-gray-900 p-8 rounded-lg shadow-lg">
              <h1 className="text-2xl font-medium text-purple-500 mb-2">Sign up</h1>
              <p className="text-sm text-gray-300">
                Already have an account?{" "}
                <Link className="text-purple-400 font-medium hover:text-purple-300 underline" href="/sign-in">
                  Sign in
                </Link>
              </p>

              <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  name="email"
                  placeholder="you@example.com"
                  required
                  className="bg-gray-800 border-gray-700 text-gray-200 focus:border-purple-500"
                />

                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Your password"
                  minLength={6}
                  required
                  className="bg-gray-800 border-gray-700 text-gray-200 focus:border-purple-500"
                />

                <SubmitButton
                  formAction={signUpAction}
                  pendingText="Signing up..."
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Sign up
                </SubmitButton>

                <FormMessage message={searchParams} />
              </div>
            </form>
            <SmtpMessage />
          </div>
        </div>
      </div>
    </main>
  );
}
