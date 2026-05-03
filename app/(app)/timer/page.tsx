import { createClient } from '@/lib/supabase/server';
import { CategoryModel } from '@/lib/models';
import { TimerClient } from '@/components/timer/TimerClient';

export default async function TimerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const categoryModel = new CategoryModel(supabase);

  const [categories, { data: sessions }] = await Promise.all([
    categoryModel.findAllByUser(user!.id),
    supabase
      .from('study_sessions')
      .select('*, category:categories(name, color)')
      .eq('user_id', user!.id)
      .order('started_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <TimerClient
      categories={categories}
      initialSessions={sessions ?? []}
    />
  );
}
