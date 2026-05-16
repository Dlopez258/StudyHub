import { SupabaseClient } from '@supabase/supabase-js';
import type { Task, TaskQuadrant, Subtask } from '@/lib/types';
import { BaseModel } from './BaseModel';

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  quadrant: TaskQuadrant;
  deadline?: string | null;
  category_id?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  quadrant?: TaskQuadrant;
  deadline?: string | null;
  category_id?: string | null;
  completed?: boolean;
  position?: number;
}

export class TaskModel extends BaseModel {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, subtasks(*), category:categories(*)')
      .eq('user_id', userId)
      .order('position');
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, subtasks(*), category:categories(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.handleError(error);
    return data ?? null;
  }

  async create(input: CreateTaskInput, userId: string): Promise<Task> {
    const title = input.title.trim();
    if (!title) throw new Error('El título de la tarea es obligatorio.');

    const { count } = await this.supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quadrant', input.quadrant);

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title,
        description: input.description ?? null,
        quadrant: input.quadrant,
        deadline: input.deadline ?? null,
        category_id: input.category_id ?? null,
        position: count ?? 0,
        user_id: userId,
      })
      .select('*, subtasks(*), category:categories(*)')
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, input: UpdateTaskInput, userId: string): Promise<Task> {
    const task = await this.findById(id, userId);
    if (!task) throw new Error('Tarea no encontrada.');

    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) {
      const t = input.title.trim();
      if (!t) throw new Error('El título no puede estar vacío.');
      updates.title = t;
    }
    if (input.description !== undefined) updates.description = input.description;
    if (input.quadrant !== undefined) updates.quadrant = input.quadrant;
    if (input.deadline !== undefined) updates.deadline = input.deadline;
    if (input.category_id !== undefined) updates.category_id = input.category_id;
    if (input.position !== undefined) updates.position = input.position;
    if (input.completed !== undefined) {
      updates.completed = input.completed;
      updates.completed_at = input.completed ? new Date().toISOString() : null;
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, subtasks(*), category:categories(*)')
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id, userId);
    if (!task) throw new Error('Tarea no encontrada.');
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) this.handleError(error);
  }

  async addSubtask(taskId: string, title: string, userId: string): Promise<Subtask> {
    const task = await this.findById(taskId, userId);
    if (!task) throw new Error('Tarea no encontrada.');

    const { count } = await this.supabase
      .from('subtasks')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId);

    const { data, error } = await this.supabase
      .from('subtasks')
      .insert({ task_id: taskId, title: title.trim(), position: count ?? 0 })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async updateSubtask(subtaskId: string, completed: boolean, userId: string): Promise<Subtask> {
    const { data: subtask } = await this.supabase
      .from('subtasks')
      .select('task_id')
      .eq('id', subtaskId)
      .single();
    if (!subtask) throw new Error('Subtarea no encontrada.');

    const task = await this.findById(subtask.task_id, userId);
    if (!task) throw new Error('Sin permiso.');

    const { data, error } = await this.supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', subtaskId)
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }
}
