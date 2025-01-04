import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LanguageLearningApp } from '@/components/language-learning-app';

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect('/sign-in');
  // }

  return <LanguageLearningApp />;
}
