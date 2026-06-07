"use client";

import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useState } from "react";

const WORKOUT_TYPES = {
  push:   { label: "Push",   color: "#f97316" },
  pull:   { label: "Pull",   color: "#3b82f6" },
  legs:   { label: "Legs",   color: "#a855f7" },
  cardio: { label: "Cardio", color: "#22c55e" },
  rest:   { label: "Rest",   color: "#94a3b8" },
  other:  { label: "Other",  color: "#8c7d70" },
} as const;

type WorkoutType = keyof typeof WORKOUT_TYPES;

type Exercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  order: number;
};

type WorkoutSession = {
  id: string;
  name: string;
  durationHours: number;
  exercises: Exercise[];
};

type WorkoutDayData = {
  id: string;
  workoutType: string;
  completed: boolean;
  sessions: WorkoutSession[];
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

const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function exerciseLabel(ex: Exercise) {
  if (ex.sets && ex.reps) return `${ex.sets}×${ex.reps}`;
  if (ex.sets) return `${ex.sets} sets`;
  return "";
}

export function DayColumn({ date, workoutDay, isToday, onMutate }: Props) {
  const [editingType, setEditingType] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionDuration, setSessionDuration] = useState(1);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const [editSessionDuration, setEditSessionDuration] = useState(1);

  // Exercise form: one open at a time
  const [addExToSession, setAddExToSession] = useState<string | null>(null);
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");

  const utils = api.useUtils();
  const invalidate = () => { onMutate(); void utils.workoutDay.listWeek.invalidate(); };

  const upsertType = api.workoutDay.upsert.useMutation({ onSuccess: invalidate });
  const toggleComplete = api.workoutDay.toggleComplete.useMutation({ onSuccess: invalidate });
  const createSession = api.workoutSession.create.useMutation({
    onSuccess: () => { invalidate(); setShowAddSession(false); setSessionName(""); setSessionDuration(1); },
  });
  const updateSession = api.workoutSession.update.useMutation({
    onSuccess: () => { invalidate(); setEditingSessionId(null); },
  });
  const deleteSession = api.workoutSession.delete.useMutation({ onSuccess: invalidate });
  const createEx = api.exercise.create.useMutation({
    onSuccess: () => { invalidate(); resetExForm(); setAddExToSession(null); },
  });
  const updateEx = api.exercise.update.useMutation({
    onSuccess: () => { invalidate(); setEditingExId(null); resetExForm(); },
  });
  const deleteEx = api.exercise.delete.useMutation({ onSuccess: invalidate });

  const dateInput = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  const workoutType = (workoutDay?.workoutType ?? "rest") as WorkoutType;
  const typeInfo = WORKOUT_TYPES[workoutType] ?? WORKOUT_TYPES.rest;
  const isCompleted = workoutDay?.completed ?? false;

  const resetExForm = () => { setExName(""); setExSets(""); setExReps(""); };

  const handleTypeChange = (type: WorkoutType) => {
    upsertType.mutate({ ...dateInput, workoutType: type });
    setEditingType(false);
  };

  const handleAddSession = async () => {
    if (!sessionName.trim()) return;
    let dayId = workoutDay?.id;
    if (!dayId) {
      const day = await upsertType.mutateAsync({ ...dateInput, workoutType: "other" });
      dayId = day.id;
    }
    createSession.mutate({ workoutDayId: dayId, name: sessionName.trim(), durationHours: sessionDuration });
  };

  const handleSaveSessionEdit = () => {
    if (!editingSessionId || !editSessionName.trim()) return;
    updateSession.mutate({ id: editingSessionId, name: editSessionName.trim(), durationHours: editSessionDuration });
  };

  const startEditSession = (s: WorkoutSession) => {
    setEditingSessionId(s.id);
    setEditSessionName(s.name);
    setEditSessionDuration(s.durationHours);
    setShowAddSession(false);
  };

  const handleAddEx = (sessionId: string) => {
    if (!exName.trim()) return;
    createEx.mutate({
      sessionId,
      name: exName.trim(),
      sets: exSets ? parseInt(exSets) : undefined,
      reps: exReps ? parseInt(exReps) : undefined,
    });
  };

  const handleEditEx = (ex: Exercise) => {
    setExName(ex.name);
    setExSets(ex.sets?.toString() ?? "");
    setExReps(ex.reps?.toString() ?? "");
    setEditingExId(ex.id);
    setAddExToSession(null);
  };

  const handleSaveEx = () => {
    if (!editingExId || !exName.trim()) return;
    updateEx.mutate({
      id: editingExId,
      name: exName.trim(),
      sets: exSets ? parseInt(exSets) : undefined,
      reps: exReps ? parseInt(exReps) : undefined,
    });
  };

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2 min-h-[260px]"
      style={{
        background: isCompleted ? "rgba(34,197,94,0.04)" : "var(--color-surface-raised)",
        border: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
      }}
    >
      {/* Header */}
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
          onClick={() => toggleComplete.mutate({ ...dateInput, completed: !isCompleted })}
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

      {/* Workout type badge */}
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

      {/* Sessions */}
      <div className="flex flex-col gap-2 flex-1">
        {(workoutDay?.sessions ?? []).map((session) => (
          <div
            key={session.id}
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--color-background)", border: "1px solid var(--color-border-subtle)" }}
          >
            {/* Session header */}
            {editingSessionId === session.id ? (
              <div className="p-2 space-y-1.5">
                <input
                  value={editSessionName}
                  onChange={(e) => setEditSessionName(e.target.value)}
                  autoFocus
                  style={inputCls}
                />
                <select
                  value={editSessionDuration}
                  onChange={(e) => setEditSessionDuration(parseFloat(e.target.value))}
                  style={{ ...inputCls, fontFamily: "inherit" }}
                >
                  {DURATION_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h} hr{h !== 1 ? "s" : ""}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingSessionId(null)}
                    className="flex-1 py-1 text-xs rounded"
                    style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSessionEdit}
                    disabled={!editSessionName.trim() || updateSession.isPending}
                    className="flex-1 py-1 text-xs rounded disabled:opacity-40"
                    style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
                  >
                    {updateSession.isPending ? "…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 py-1.5 group">
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                    {session.name}
                  </span>
                  <span className="text-xs ml-1.5" style={{ color: "var(--color-muted)" }}>
                    {session.durationHours} hr{session.durationHours !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditSession(session)} className="text-xs" style={{ color: "var(--color-muted)" }}>✏</button>
                  <button onClick={() => deleteSession.mutate({ id: session.id })} className="text-xs" style={{ color: "var(--color-muted)" }}>✕</button>
                </div>
              </div>
            )}

            {/* Exercises within session */}
            <div className="px-2 pb-1.5 space-y-1">
              {session.exercises.map((ex) =>
                editingExId === ex.id ? (
                  <ExerciseForm
                    key={ex.id}
                    name={exName} sets={exSets} reps={exReps}
                    onName={setExName} onSets={setExSets} onReps={setExReps}
                    onSave={handleSaveEx}
                    onCancel={() => { setEditingExId(null); resetExForm(); }}
                    saveLabel="Save"
                    isPending={updateEx.isPending}
                  />
                ) : (
                  <div key={ex.id} className="text-xs rounded px-1.5 py-1 group flex items-start justify-between gap-1"
                    style={{ background: "var(--color-surface-raised)" }}>
                    <div>
                      <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{ex.name}</span>
                      {exerciseLabel(ex) && (
                        <span className="ml-1" style={{ color: "var(--color-muted)" }}>{exerciseLabel(ex)}</span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => handleEditEx(ex)} style={{ color: "var(--color-muted)" }}>✏</button>
                      <button onClick={() => deleteEx.mutate({ id: ex.id })} style={{ color: "var(--color-muted)" }}>✕</button>
                    </div>
                  </div>
                )
              )}

              {addExToSession === session.id ? (
                <ExerciseForm
                  name={exName} sets={exSets} reps={exReps}
                  onName={setExName} onSets={setExSets} onReps={setExReps}
                  onSave={() => handleAddEx(session.id)}
                  onCancel={() => { setAddExToSession(null); resetExForm(); }}
                  saveLabel="Add"
                  isPending={createEx.isPending}
                />
              ) : (
                editingExId === null && (
                  <button
                    onClick={() => { setAddExToSession(session.id); setEditingExId(null); resetExForm(); }}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: "var(--color-muted)" }}
                  >
                    + exercise
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add session */}
      {showAddSession ? (
        <div className="rounded-lg p-2 space-y-1.5" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
          <input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Session name (e.g. Lifting)"
            autoFocus
            style={inputCls}
          />
          <select
            value={sessionDuration}
            onChange={(e) => setSessionDuration(parseFloat(e.target.value))}
            style={{ ...inputCls, fontFamily: "inherit" }}
          >
            {DURATION_OPTIONS.map((h) => (
              <option key={h} value={h}>{h} hr{h !== 1 ? "s" : ""}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowAddSession(false); setSessionName(""); setSessionDuration(1); }}
              className="flex-1 py-1 text-xs rounded"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSession}
              disabled={!sessionName.trim() || createSession.isPending}
              className="flex-1 py-1 text-xs rounded disabled:opacity-40"
              style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
            >
              {createSession.isPending ? "…" : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowAddSession(true); setEditingSessionId(null); }}
          className="text-xs mt-auto pt-1 text-left transition-opacity hover:opacity-70"
          style={{ color: "var(--color-muted)" }}
        >
          + session
        </button>
      )}
    </div>
  );
}

interface ExerciseFormProps {
  name: string; sets: string; reps: string;
  onName: (v: string) => void; onSets: (v: string) => void; onReps: (v: string) => void;
  onSave: () => void; onCancel: () => void;
  saveLabel: string; isPending: boolean;
}

function ExerciseForm({ name, sets, reps, onName, onSets, onReps, onSave, onCancel, saveLabel, isPending }: ExerciseFormProps) {
  return (
    <div className="rounded p-1.5 space-y-1" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
      <input value={name} onChange={(e) => onName(e.target.value)} placeholder="Exercise name" autoFocus style={inputCls} />
      <div className="grid grid-cols-2 gap-1">
        <input value={sets} onChange={(e) => onSets(e.target.value)} placeholder="Sets" type="number" min="1" style={inputCls} />
        <input value={reps} onChange={(e) => onReps(e.target.value)} placeholder="Reps" type="number" min="1" style={inputCls} />
      </div>
      <div className="flex gap-1">
        <button onClick={onCancel} className="flex-1 py-1 text-xs rounded" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={!name.trim() || isPending} className="flex-1 py-1 text-xs rounded disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}>
          {isPending ? "…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
