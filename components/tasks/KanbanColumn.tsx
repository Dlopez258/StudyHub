'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task, TaskQuadrant } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface Props {
  quadrant: { id: TaskQuadrant; label: string; color: string; bg: string };
  tasks: Task[];
  onAddTask: () => void;
  onCardClick: (task: Task) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export function KanbanColumn({ quadrant, tasks, onAddTask, onCardClick, onToggleComplete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id });

  return (
    <div className={`flex flex-col w-72 flex-shrink-0 rounded-xl border-2 ${quadrant.bg} transition-shadow ${isOver ? 'shadow-lg' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold text-sm ${quadrant.color}`}>{quadrant.label}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quadrant.color} bg-white/60`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className={`p-1 rounded-lg hover:bg-white/80 transition-colors ${quadrant.color}`}
          aria-label="Agregar tarea"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 px-3 pb-3 min-h-24 overflow-y-auto"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-[var(--color-gray-mid)] text-center">
              Sin tareas aquí.<br />Arrastra o añade una.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
