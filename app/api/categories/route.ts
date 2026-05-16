import { NextRequest } from 'next/server';
import { CategoryModel } from '@/lib/models';
import { getAuthContext, ok, err } from '@/lib/api/helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const model = new CategoryModel(ctx.supabase);
    const categories = await model.findAllByUser(ctx.userId);
    return ok(categories);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if ('status' in ctx) return ctx;

  try {
    const body = await req.json();
    const model = new CategoryModel(ctx.supabase);
    const category = await model.create(body, ctx.userId);
    return ok(category, 201);
  } catch (e) {
    return err((e as Error).message);
  }
}
