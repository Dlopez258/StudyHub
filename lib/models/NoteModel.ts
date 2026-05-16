import { SupabaseClient } from '@supabase/supabase-js';
import type { Note } from '@/lib/types';
import { BaseModel } from './BaseModel';

export interface CreateNoteInput {
  title?: string;
  folder_id?: string | null;
  content?: Record<string, unknown>;
  content_text?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  folder_id?: string | null;
  content?: Record<string, unknown>;
  content_text?: string;
  tags?: string[];
}

export class NoteModel extends BaseModel {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAllByUser(userId: string): Promise<Partial<Note>[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('id, user_id, folder_id, title, content_text, tags, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string, userId: string): Promise<Note | null> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async search(query: string, userId: string): Promise<Partial<Note>[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('id, title, content_text, tags, updated_at, folder_id')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content_text.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20);
    if (error) this.handleError(error);
    return data ?? [];
  }

  async create(input: CreateNoteInput, userId: string): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert({
        title: input.title ?? 'Sin título',
        folder_id: input.folder_id ?? null,
        content: input.content ?? {},
        content_text: input.content_text ?? '',
        tags: input.tags ?? [],
        user_id: userId,
      })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, input: UpdateNoteInput, userId: string): Promise<Note> {
    const note = await this.findById(id, userId);
    if (!note) throw new Error('Nota no encontrada.');

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.folder_id !== undefined) updates.folder_id = input.folder_id;
    if (input.content !== undefined) updates.content = input.content;
    if (input.content_text !== undefined) updates.content_text = input.content_text;
    if (input.tags !== undefined) updates.tags = input.tags;

    const { data, error } = await this.supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const note = await this.findById(id, userId);
    if (!note) throw new Error('Nota no encontrada.');
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) this.handleError(error);
  }
}
