import { SupabaseClient } from '@supabase/supabase-js';

export class ModelError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ModelError';
  }
}

export abstract class BaseModel {
  constructor(protected readonly supabase: SupabaseClient) {}

  protected handleError(error: { message: string; code?: string }): never {
    throw new ModelError(error.message, error.code);
  }
}
