"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TodoCard } from "./TodoCard";
import { TodoForm } from "./TodoForm";
import { NotificationPermission } from "./NotificationPermission";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  category: { id: string; name: string; color: string } | null;
};

export function TodoList() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category") ?? undefined;

  const { data: todos, isLoading } = api.todo.list.useQuery({ categoryId });
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();

  const openCreate = () => { setEditingTodo(undefined); setShowForm(true); };
  const openEdit = (todo: Todo) => { setEditingTodo(todo); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingTodo(undefined); };

  const activeTodos = todos?.filter((t: Todo) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t: Todo) => t.completed) ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-bold"
          style={{  color: "var(--color-foreground)" }}
        >
          {categoryId ? "Tasks" : "All tasks"}
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New task
        </button>
      </div>

      <NotificationPermission />

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }} />
          ))}
        </div>
      )}

      {!isLoading && activeTodos.length === 0 && completedTodos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>No tasks yet. Create one to get started.</p>
        </div>
      )}

      {activeTodos.length > 0 && (
        <div className="space-y-2 mb-6">
          {activeTodos.map((todo: Todo) => (
            <TodoCard key={todo.id} todo={todo} onEdit={openEdit} />
          ))}
        </div>
      )}

      {completedTodos.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-muted)", opacity: 0.6 }}>
            Completed ({completedTodos.length})
          </p>
          <div className="space-y-2">
            {completedTodos.map((todo: Todo) => (
              <TodoCard key={todo.id} todo={todo} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {showForm && <TodoForm todo={editingTodo} onClose={closeForm} />}
    </div>
  );
}
