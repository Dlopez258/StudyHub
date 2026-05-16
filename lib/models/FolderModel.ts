import { SupabaseClient } from '@supabase/supabase-js';
import type { Folder } from '@/lib/types';
import { BaseModel } from './BaseModel';

export interface CreateFolderInput {
  name: string;
  color?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  color?: string | null;
}

export class FolderModel extends BaseModel {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAllByUser(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*, note_count:notes(count)')
      .eq('user_id', userId)
      .order('name');
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string, userId: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async create(input: CreateFolderInput, userId: string): Promise<Folder> {
    const name = input.name.trim();
    if (name.length < 1) throw new Error('El nombre de la carpeta es obligatorio.');

    const { data, error } = await this.supabase
      .from('folders')
      .insert({ name, color: input.color ?? null, user_id: userId })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, input: UpdateFolderInput, userId: string): Promise<Folder> {
    const folder = await this.findById(id, userId);
    if (!folder) throw new Error('Carpeta no encontrada.');

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const n = input.name.trim();
      if (!n) throw new Error('El nombre no puede estar vacío.');
      updates.name = n;
    }
    if (input.color !== undefined) updates.color = input.color;

    const { data, error } = await this.supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const folder = await this.findById(id, userId);
    if (!folder) throw new Error('Carpeta no encontrada.');

    await this.supabase
      .from('notes')
      .update({ folder_id: null })
      .eq('folder_id', id)
      .eq('user_id', userId);

    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) this.handleError(error);
  }
}
