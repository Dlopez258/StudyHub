import { SupabaseClient } from '@supabase/supabase-js';
import type { StudySession, StudyMode } from '@/lib/types';
import { BaseModel } from './BaseModel';

export interface CreateSessionInput {
  category_id?: string | null;
  duration_minutes: number;
  actual_duration_seconds: number;
  mode: StudyMode;
  pomodoro_cycles_completed?: number;
  started_at: string;
  completed_at?: string | null;
  notes?: string | null;
}

export interface SessionStats {
  totalMinutesThisWeek: number;
  currentStreak: number;
  topCategoryThisMonth: string | null;
  dailyAverage: number;
}

export class SessionModel extends BaseModel {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAllByUser(userId: string, limit = 50): Promise<StudySession[]> {
    const { data, error } = await this.supabase
      .from('study_sessions')
      .select('*, category:categories(name, color)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string, userId: string): Promise<StudySession | null> {
    const { data, error } = await this.supabase
      .from('study_sessions')
      .select('*, category:categories(name, color)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async create(input: CreateSessionInput, userId: string): Promise<StudySession> {
    if (input.duration_minutes < 10 || input.duration_minutes > 120) {
      throw new Error('La duración debe estar entre 10 y 120 minutos.');
    }

    const { data, error } = await this.supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        category_id: input.category_id ?? null,
        duration_minutes: input.duration_minutes,
        actual_duration_seconds: input.actual_duration_seconds,
        mode: input.mode,
        pomodoro_cycles_completed: input.pomodoro_cycles_completed ?? 0,
        started_at: input.started_at,
        completed_at: input.completed_at ?? null,
        notes: input.notes ?? null,
      })
      .select('*, category:categories(name, color)')
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async getStats(userId: string): Promise<SessionStats> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: weekData } = await this.supabase
      .from('study_sessions')
      .select('actual_duration_seconds, started_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('started_at', weekStart.toISOString());

    const totalMinutesThisWeek = Math.round(
      (weekData ?? []).reduce((sum, s) => sum + s.actual_duration_seconds, 0) / 60
    );

    const dailyAverage = weekData && weekData.length > 0
      ? Math.round(totalMinutesThisWeek / 7)
      : 0;

    const { data: monthData } = await this.supabase
      .from('study_sessions')
      .select('category_id, actual_duration_seconds, category:categories(name)')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('started_at', monthStart.toISOString());

    const categoryTotals = new Map<string, { name: string; seconds: number }>();
    for (const s of monthData ?? []) {
      if (!s.category_id) continue;
      const existing = categoryTotals.get(s.category_id);
      const cat = s.category as { name: string } | { name: string }[] | null;
      const name = (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? s.category_id;
      categoryTotals.set(s.category_id, {
        name,
        seconds: (existing?.seconds ?? 0) + s.actual_duration_seconds,
      });
    }
    const topCategoryThisMonth = categoryTotals.size > 0
      ? [...categoryTotals.values()].sort((a, b) => b.seconds - a.seconds)[0].name
      : null;

    const { data: streakData } = await this.supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false });

    const currentStreak = this.calculateStreak(streakData ?? []);

    return { totalMinutesThisWeek, currentStreak, topCategoryThisMonth, dailyAverage };
  }

  private calculateStreak(sessions: { started_at: string }[]): number {
    if (sessions.length === 0) return 0;
    const days = new Set(sessions.map((s) => s.started_at.slice(0, 10)));
    const sorted = [...days].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    if (sorted[0] !== today && sorted[0] !== new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  }
}
