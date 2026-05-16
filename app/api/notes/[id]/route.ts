import { NextRequest } from 'next/server';
import { NoteModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  const { id } = await params;
  try {
    const model = new NoteModel(ctx.supabase);
    const note = await model.findById(id, ctx.userId);
    if (!note) return err('Nota no encontrada', 404);
    return ok(note);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  const { id } = await params;
  try {
    const body = await req.json();
    const model = new NoteModel(ctx.supabase);
    const note = await model.update(id, body, ctx.userId);
    return ok(note);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  const { id } = await params;
  try {
    const model = new NoteModel(ctx.supabase);
    await model.delete(id, ctx.userId);
    return ok({ deleted: true });
  } catch (e) {
    return err((e as Error).message);
  }
}
