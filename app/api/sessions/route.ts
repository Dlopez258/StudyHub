import { NextRequest } from 'next/server';
import { SessionModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const model = new SessionModel(ctx.supabase);
    const sessions = await model.findAllByUser(ctx.userId);
    return ok(sessions);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const body = await req.json();
    const model = new SessionModel(ctx.supabase);
    const session = await model.create(body, ctx.userId);
    return ok(session, 201);
  } catch (e) {
    return err((e as Error).message);
  }
}
