"use client";

import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useState } from "react";

const WORKOUT_TYPES = {
  push:    { label: "Push",    color: "#f97316" },
  pull:    { label: "Pull",    color: "#3b82f6" },
  legs:    { label: "Legs",    color: "#a855f7" },
  cardio:  { label: "Cardio",  color: "#22c55e" },
  rest:    { label: "Rest",    color: "#94a3b8" },
  other:   { label: "Other",   color: "#8c7d70" },
} as const;

type WorkoutType = keyof typeof WORKOUT_TYPES;

type Exercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weightLbs: number | null;
  durationMin: number | null;
  order: number;
};

type WorkoutDayData = {
  id: string;
  workoutType: string;
  completed: boolean;
  exercises: Exercise[];
};

interface Props {
  date: Date;
  workoutDay: WorkoutDayData | null;
  isToday: boolean;
  onMutate: () => void;
}

const inputCls: React.CSSProperties = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
  borderRadius: "6px",
  padding: "4px 6px",
  fontSize: "12px",
  outline: "none",
  width: "100%",
};

function exerciseLabel(ex: Exercise) {
  const parts: string[] = [];
  if (ex.sets && ex.reps) parts.push(`${ex.sets}×${ex.reps}`);
  else if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.weightLbs) parts.push(`@ ${ex.weightLbs} lb`);
  if (ex.durationMin) parts.push(`${ex.durationMin} min`);
  return parts.join(" · ");
}

export function DayColumn({ date, workoutDay, isToday, onMutate }: Props) {
  const [editingType, setEditingType] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Exercise form state
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [exDuration, setExDuration] = useState("");

  const utils = api.useUtils();
  const invalidate = () => { onMutate(); void utils.workoutDay.listWeek.invalidate(); };

  const upsertType = api.workoutDay.upsert.useMutation({ onSuccess: invalidate });
  const toggleComplete = api.workoutDay.toggleComplete.useMutation({ onSuccess: invalidate });
  const createEx = api.exercise.create.useMutation({ onSuccess: () => { invalidate(); resetForm(); setShowAdd(false); } });
  const updateEx = api.exercise.update.useMutation({ onSuccess: () => { invalidate(); setEditingId(null); } });
  const deleteEx = api.exercise.delete.useMutation({ onSuccess: invalidate });

  const dateInput = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  const workoutType = (workoutDay?.workoutType ?? "rest") as WorkoutType;
  const typeInfo = WORKOUT_TYPES[workoutType] ?? WORKOUT_TYPES.rest;
  const isCompleted = workoutDay?.completed ?? false;

  const resetForm = () => { setExName(""); setExSets(""); setExReps(""); setExWeight(""); setExDuration(""); };

  const handleTypeChange = (type: WorkoutType) => {
    upsertType.mutate({ ...dateInput, workoutType: type });
    setEditingType(false);
  };

  const handleToggleComplete = () => {
    toggleComplete.mutate({ ...dateInput, completed: !isCompleted });
  };

  const handleAddExercise = async () => {
    if (!exName.trim()) return;
    // Ensure workout day exists
    let dayId = workoutDay?.id;
    if (!dayId) {
      const day = await upsertType.mutateAsync({ ...dateInput, workoutType: "other" });
      dayId = day.id;
    }
    createEx.mutate({
      workoutDayId: dayId,
      name: exName.trim(),
      sets: exSets ? parseInt(exSets) : undefined,
      reps: exReps ? parseInt(exReps) : undefined,
      weightLbs: exWeight ? parseFloat(exWeight) : undefined,
      durationMin: exDuration ? parseInt(exDuration) : undefined,
    });
  };

  const handleEditExercise = (ex: Exercise) => {
    setExName(ex.name);
    setExSets(ex.sets?.toString() ?? "");
    setExReps(ex.reps?.toString() ?? "");
    setExWeight(ex.weightLbs?.toString() ?? "");
    setExDuration(ex.durationMin?.toString() ?? "");
    setEditingId(ex.id);
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !exName.trim()) return;
    updateEx.mutate({
      id: editingId,
      name: exName.trim(),
      sets: exSets ? parseInt(exSets) : undefined,
      reps: exReps ? parseInt(exReps) : undefined,
      weightLbs: exWeight ? parseFloat(exWeight) : undefined,
      durationMin: exDuration ? parseInt(exDuration) : undefined,
    });
    resetForm();
  };

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2 min-h-[260px]"
      style={{
        background: isCompleted ? "rgba(34,197,94,0.04)" : "var(--color-surface-raised)",
        border: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
      }}
    >
      {/* Header: day + complete toggle */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>{format(date, "EEE")}</div>
          <div
            className="text-xl font-semibold leading-tight"
            style={{ color: isToday ? "var(--color-accent)" : "var(--color-foreground)", fontFamily: "var(--font-display)" }}
          >
            {format(date, "d")}
          </div>
        </div>
        <button
          onClick={handleToggleComplete}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all mt-0.5"
          style={{
            background: isCompleted ? "#22c55e" : "transparent",
            border: `2px solid ${isCompleted ? "#22c55e" : "var(--color-border)"}`,
          }}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Workout type */}
      {editingType ? (
        <select
          autoFocus
          value={workoutType}
          onChange={(e) => handleTypeChange(e.target.value as WorkoutType)}
          onBlur={() => setEditingType(false)}
          style={{ ...inputCls, fontFamily: "inherit" }}
        >
          {Object.entries(WORKOUT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      ) : (
        <button
          onClick={() => setEditingType(true)}
          className="text-xs px-2 py-0.5 rounded-full w-fit transition-opacity hover:opacity-80"
          style={{ background: typeInfo.color + "22", color: typeInfo.color, fontWeight: 500 }}
        >
          {typeInfo.label}
        </button>
      )}

      {/* Exercise list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {workoutDay?.exercises.map((ex) =>
          editingId === ex.id ? (
            <ExerciseInlineForm
              key={ex.id}
              name={exName} sets={exSets} reps={exReps} weight={exWeight} duration={exDuration}
              onName={setExName} onSets={setExSets} onReps={setExReps} onWeight={setExWeight} onDuration={setExDuration}
              onSave={handleSaveEdit}
              onCancel={() => { setEditingId(null); resetForm(); }}
              saveLabel="Save"
              isPending={updateEx.isPending}
            />
          ) : (
            <div
              key={ex.id}
              className="text-xs rounded-lg p-2 group"
              style={{ background: "var(--color-background)", border: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-medium leading-snug" style={{ color: "var(--color-foreground)" }}>{ex.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleEditExercise(ex)} style={{ color: "var(--color-muted)" }}>✏</button>
                  <button onClick={() => deleteEx.mutate({ id: ex.id })} style={{ color: "var(--color-muted)" }}>✕</button>
                </div>
              </div>
              {exerciseLabel(ex) && (
                <div className="mt-0.5" style={{ color: "var(--color-muted)" }}>{exerciseLabel(ex)}</div>
              )}
            </div>
          )
        )}
      </div>

      {/* Add exercise form */}
      {showAdd && (
        <ExerciseInlineForm
          name={exName} sets={exSets} reps={exReps} weight={exWeight} duration={exDuration}
          onName={setExName} onSets={setExSets} onReps={setExReps} onWeight={setExWeight} onDuration={setExDuration}
          onSave={handleAddExercise}
          onCancel={() => { setShowAdd(false); resetForm(); }}
          saveLabel="Add"
          isPending={createEx.isPending}
        />
      )}

      {/* Add exercise button */}
      {!showAdd && !editingId && (
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs mt-auto pt-1 text-left transition-opacity hover:opacity-70"
          style={{ color: "var(--color-muted)" }}
        >
          + exercise
        </button>
      )}
    </div>
  );
}

interface FormProps {
  name: string; sets: string; reps: string; weight: string; duration: string;
  onName: (v: string) => void; onSets: (v: string) => void; onReps: (v: string) => void;
  onWeight: (v: string) => void; onDuration: (v: string) => void;
  onSave: () => void; onCancel: () => void;
  saveLabel: string; isPending: boolean;
}

function ExerciseInlineForm({ name, sets, reps, weight, duration, onName, onSets, onReps, onWeight, onDuration, onSave, onCancel, saveLabel, isPending }: FormProps) {
  return (
    <div className="rounded-lg p-2 space-y-1.5" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
      <input value={name} onChange={(e) => onName(e.target.value)} placeholder="Exercise name" autoFocus style={inputCls} />
      <div className="grid grid-cols-2 gap-1">
        <input value={sets} onChange={(e) => onSets(e.target.value)} placeholder="Sets" type="number" min="1" style={inputCls} />
        <input value={reps} onChange={(e) => onReps(e.target.value)} placeholder="Reps" type="number" min="1" style={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <input value={weight} onChange={(e) => onWeight(e.target.value)} placeholder="lb" type="number" min="0" step="0.5" style={inputCls} />
        <input value={duration} onChange={(e) => onDuration(e.target.value)} placeholder="min" type="number" min="0" style={inputCls} />
      </div>
      <div className="flex gap-1 pt-0.5">
        <button onClick={onCancel} className="flex-1 py-1 text-xs rounded" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={!name.trim() || isPending} className="flex-1 py-1 text-xs rounded disabled:opacity-40" style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}>
          {isPending ? "…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
