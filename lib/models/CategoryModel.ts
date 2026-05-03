import { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/lib/types';
import { BaseModel } from './BaseModel';

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export class CategoryModel extends BaseModel {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  private validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      throw new Error('El nombre debe tener entre 2 y 40 caracteres.');
    }
    return trimmed;
  }

  private validateColor(color: string): string {
    if (!HEX_COLOR_RE.test(color)) {
      throw new Error('El color debe ser un valor hexadecimal válido (#RRGGBB).');
    }
    return color;
  }

  async findAllByUser(userId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async findByName(name: string, userId: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('name', name.trim())
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async create(input: CreateCategoryInput, userId: string): Promise<Category> {
    const name = this.validateName(input.name);
    const color = this.validateColor(input.color);

    const existing = await this.findByName(name, userId);
    if (existing) {
      throw new Error(`Ya existe una categoría con el nombre "${name}".`);
    }

    const { data, error } = await this.supabase
      .from('categories')
      .insert({ name, color, user_id: userId })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, input: UpdateCategoryInput, userId: string): Promise<Category> {
    const current = await this.findById(id, userId);
    if (!current) throw new Error('Categoría no encontrada.');

    const updates: Partial<CreateCategoryInput> = {};

    if (input.name !== undefined) {
      const name = this.validateName(input.name);
      if (name !== current.name) {
        const duplicate = await this.findByName(name, userId);
        if (duplicate) throw new Error(`Ya existe una categoría con el nombre "${name}".`);
      }
      updates.name = name;
    }

    if (input.color !== undefined) {
      updates.color = this.validateColor(input.color);
    }

    const { data, error } = await this.supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const current = await this.findById(id, userId);
    if (!current) throw new Error('Categoría no encontrada.');

    // The FK ON DELETE SET NULL handles orphan cleanup at DB level,
    // but we do it explicitly here to document the business rule.
    await Promise.all([
      this.supabase
        .from('tasks')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', userId),
      this.supabase
        .from('study_sessions')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', userId),
    ]);

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) this.handleError(error);
  }
}
