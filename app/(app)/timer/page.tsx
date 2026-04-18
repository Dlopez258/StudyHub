import { createClient } from '@/lib/supabase/server';
import { TimerClient } from '@/components/timer/TimerClient';

export default async function TimerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: categories }, { data: sessions }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('name'),
    supabase
      .from('study_sessions')
      .select('*, category:categories(name, color)')
      .eq('user_id', user!.id)
      .order('started_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <TimerClient
      categories={categories ?? []}
      initialSessions={sessions ?? []}
    />
  );
}
