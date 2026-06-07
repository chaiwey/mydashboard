"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { addDays, startOfWeek, format, isSameDay } from "date-fns";
import { DayColumn } from "./DayColumn";

function mondayOf(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function dateKey(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function toKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function localKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function WeeklySchedule() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekInput = dateKey(weekStart);

  const { data: workoutDays, refetch } = api.workoutDay.listWeek.useQuery(weekInput);

  const workoutMap = new Map(
    (workoutDays ?? []).map((wd) => [toKey(new Date(wd.date as Date)), wd])
  );

  const totalHours = (workoutDays ?? []).reduce(
    (sum, wd) => sum + wd.sessions.reduce((s, sess) => s + sess.durationHours, 0),
    0
  );
  const barPct = Math.min((totalHours / 10) * 100, 100);

  const prevWeek = () => setWeekStart((w: Date) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w: Date) => addDays(w, 7));
  const goToday = () => setWeekStart(mondayOf(new Date()));

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--color-foreground)", minWidth: "160px", textAlign: "center" }}>
          {weekLabel}
        </span>
        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={goToday}
          className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-70 ml-1"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
        >
          Today
        </button>
      </div>

      {/* 7-column grid */}
      <div className="overflow-x-auto flex-1">
        <div className="grid grid-cols-7 gap-2 min-w-[840px] h-full">
          {weekDays.map((day) => {
            const k = localKey(day);
            const data = workoutMap.get(k) ?? null;
            return (
              <DayColumn
                key={k}
                date={day}
                workoutDay={data}
                isToday={isSameDay(day, new Date())}
                onMutate={() => refetch()}
              />
            );
          })}
        </div>
      </div>

      {/* Weekly hours bar */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
      >
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: "var(--color-muted)" }}>Exercise this week</span>
          <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, background: "#22c55e" }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs" style={{ color: "var(--color-muted)", opacity: 0.5 }}>10 hr goal</span>
        </div>
      </div>
    </div>
  );
}
