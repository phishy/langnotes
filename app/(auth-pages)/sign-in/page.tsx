import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

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
              Your intelligent companion for language learning. Take notes, track progress,
              and master new languages with our AI-powered platform that adapts to your
              learning style.
            </p>
          </div>
        </div>

        {/* Second Column - Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <form className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-medium text-purple-500 mb-2">Sign in</h1>
            <p className="text-sm text-gray-300">
              Don't have an account?{" "}
              <Link className="text-purple-400 font-medium hover:text-purple-300 underline" href="/sign-up">
                Sign up
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

              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Link
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>

              <Input
                type="password"
                name="password"
                placeholder="Your password"
                required
                className="bg-gray-800 border-gray-700 text-gray-200 focus:border-purple-500"
              />

              <SubmitButton
                pendingText="Signing In..."
                formAction={signInAction}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign in
              </SubmitButton>

              <FormMessage message={searchParams} />
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
