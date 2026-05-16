import { NextRequest } from 'next/server';
import { NoteModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const model = new NoteModel(ctx.supabase);
    const q = req.nextUrl.searchParams.get('q');
    const notes = q
      ? await model.search(q, ctx.userId)
      : await model.findAllByUser(ctx.userId);
    return ok(notes);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const body = await req.json();
    const model = new NoteModel(ctx.supabase);
    const note = await model.create(body, ctx.userId);
    return ok(note, 201);
  } catch (e) {
    return err((e as Error).message);
  }
}
