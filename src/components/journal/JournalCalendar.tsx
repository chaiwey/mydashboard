"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type DateSelection = { year: number; month: number; day: number };

interface Props {
  selectedDate: DateSelection;
  onSelectDate: (d: DateSelection) => void;
  isPrivate?: boolean;
}

export function JournalCalendar({ selectedDate, onSelectDate, isPrivate = false }: Props) {
  const [viewYear, setViewYear] = useState(selectedDate.year);
  const [viewMonth, setViewMonth] = useState(selectedDate.month);

  const { data: datesWithEntries } = api.journalEntry.listDates.useQuery(
    { year: viewYear, month: viewMonth, isPrivate },
    { staleTime: 30_000 }
  );
  const entrySet = new Set(datesWithEntries ?? []);

  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth && today.getDate() === day;

  const isSelected = (day: number) =>
    selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === day;

  const hasEntries = (day: number) => {
    const s = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entrySet.has(s);
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div
      className="rounded-2xl p-4 select-none"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg transition-colors hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
        >
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg transition-colors hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs py-1"
            style={{ color: "var(--color-muted)", opacity: 0.5 }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={day}
              onClick={() => onSelectDate({ year: viewYear, month: viewMonth, day })}
              className="flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors relative"
              style={{
                background: isSelected(day)
                  ? "var(--color-accent)"
                  : isToday(day)
                  ? "var(--color-border-subtle)"
                  : "transparent",
                color: isSelected(day)
                  ? "var(--color-surface-raised)"
                  : "var(--color-foreground)",
              }}
            >
              <span className="text-xs leading-none">{day}</span>
              {hasEntries(day) && (
                <span
                  className="mt-0.5 w-1 h-1 rounded-full"
                  style={{
                    background: isSelected(day) ? "var(--color-surface-raised)" : "var(--color-accent)",
                    opacity: isSelected(day) ? 0.6 : 1,
                  }}
                />
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
