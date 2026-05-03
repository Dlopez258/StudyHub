'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { CategoryModel } from '@/lib/models';
import type { Category } from '@/lib/types';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const CategorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(40, 'El nombre no puede superar los 40 caracteres.'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un valor hexadecimal válido (#RRGGBB).'),
});

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('No autenticado.');
  return { supabase, user };
}

export async function createCategoryAction(
  input: { name: string; color: string },
): Promise<ActionResult<Category>> {
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const model = new CategoryModel(supabase);
    const category = await model.create(parsed.data, user.id);
    revalidatePath('/categories');
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error al crear la categoría.' };
  }
}

export async function updateCategoryAction(
  id: string,
  input: { name: string; color: string },
): Promise<ActionResult<Category>> {
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const model = new CategoryModel(supabase);
    const category = await model.update(id, parsed.data, user.id);
    revalidatePath('/categories');
    return { ok: true, data: category };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error al actualizar la categoría.' };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<void>> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const model = new CategoryModel(supabase);
    await model.delete(id, user.id);
    revalidatePath('/categories');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error al eliminar la categoría.' };
  }
}
