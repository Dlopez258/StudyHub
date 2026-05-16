import { NextRequest } from 'next/server';
import { FolderModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  const { id } = await params;
  try {
    const model = new FolderModel(ctx.supabase);
    const folder = await model.findById(id, ctx.userId);
    if (!folder) return err('Carpeta no encontrada', 404);
    return ok(folder);
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
    const model = new FolderModel(ctx.supabase);
    const folder = await model.update(id, body, ctx.userId);
    return ok(folder);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  const { id } = await params;
  try {
    const model = new FolderModel(ctx.supabase);
    await model.delete(id, ctx.userId);
    return ok({ deleted: true });
  } catch (e) {
    return err((e as Error).message);
  }
}
