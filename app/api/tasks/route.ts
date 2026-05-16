import { NextRequest } from 'next/server';
import { TaskModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const model = new TaskModel(ctx.supabase);
    const tasks = await model.findAllByUser(ctx.userId);
    return ok(tasks);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const body = await req.json();
    const model = new TaskModel(ctx.supabase);
    const task = await model.create(body, ctx.userId);
    return ok(task, 201);
  } catch (e) {
    return err((e as Error).message);
  }
}
