import { NextRequest } from 'next/server';
import { FolderModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const model = new FolderModel(ctx.supabase);
    const folders = await model.findAllByUser(ctx.userId);
    return ok(folders);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const body = await req.json();
    const model = new FolderModel(ctx.supabase);
    const folder = await model.create(body, ctx.userId);
    return ok(folder, 201);
  } catch (e) {
    return err((e as Error).message);
  }
}
