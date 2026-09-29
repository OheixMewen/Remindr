import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

import type { Occurrence, Recurrence, Task } from "@/src/types";
import { parseISODate } from "@/src/lib/dates";
import { WEEKDAY_LONG } from "@/src/lib/dates";

const MAX_SLOTS = 400;

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Return the recurrence slot dates ("yyyy-MM-dd") that fall within [start, end].
export function recurrenceSlotDates(task: Task, start: Date, end: Date): string[] {
  const rec = task.recurrence;
  if (!rec) return [];
  const anchor = startOfDay(parseISODate(task.date));
  const endLimit = task.recurrenceEndDate ? startOfDay(parseISODate(task.recurrenceEndDate)) : null;
  const hardEnd = endLimit && endLimit < end ? endLimit : end;
  const out: string[] = [];

  if (hardEnd < anchor) return out;

  if (rec.freq === "daily") {
    const step = Math.max(1, rec.interval || 1);
    let d = anchor;
    if (d < start) {
      const diff = differenceInCalendarDays(start, anchor);
      const k = Math.ceil(diff / step);
      d = addDays(anchor, k * step);
    }
    let count = 0;
    while (d <= hardEnd && count < MAX_SLOTS) {
      const wd = getDay(d);
      if (!(rec.weekdaysOnly && (wd === 0 || wd === 6))) out.push(fmt(d));
      d = addDays(d, step);
      count++;
    }
  } else if (rec.freq === "weekly") {
    const step = Math.max(1, rec.interval || 1);
    const weekdays =
      rec.weekdays && rec.weekdays.length ? [...rec.weekdays].sort((a, b) => a - b) : [getDay(anchor)];
    const anchorWeekStart = addDays(anchor, -getDay(anchor)); // Sunday of anchor week
    let weekStart = anchorWeekStart;
    if (weekStart < start) {
      const weeksDiff = Math.floor(differenceInCalendarDays(start, anchorWeekStart) / 7);
      const k = Math.floor(weeksDiff / step);
      weekStart = addWeeks(anchorWeekStart, k * step);
    }
    let count = 0;
    while (weekStart <= hardEnd && count < MAX_SLOTS) {
      for (const wd of weekdays) {
        const d = addDays(weekStart, wd);
        if (d >= anchor && d >= start && d <= hardEnd) out.push(fmt(d));
      }
      weekStart = addWeeks(weekStart, step);
      count++;
    }
    out.sort();
  } else if (rec.freq === "monthly") {
    const step = Math.max(1, rec.interval || 1);
    let m = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    let count = 0;
    while (m <= hardEnd && count < MAX_SLOTS) {
      const last = endOfMonth(m).getDate();
      let day: number;
      if (rec.monthDay === "last") day = last;
      else day = Math.min(typeof rec.monthDay === "number" ? rec.monthDay : anchor.getDate(), last);
      const d = new Date(m.getFullYear(), m.getMonth(), day);
      if (d >= anchor && d >= start && d <= hardEnd) out.push(fmt(d));
      m = addMonths(m, step);
      count++;
    }
  }
  return out;
}

export function buildOccurrence(task: Task, slotISO: string): Occurrence {
  const ex = task.exceptions?.[slotISO];
  const ov = ex?.overrides ?? {};
  const isRecurring = !!task.recurrence;
  return {
    key: `${task.id}::${slotISO}`,
    taskId: task.id,
    originalDate: slotISO,
    date: ov.date ?? slotISO,
    time: ov.time !== undefined ? ov.time : task.time,
    title: ov.title ?? task.title,
    notes: ov.notes ?? task.notes,
    priority: ov.priority ?? task.priority,
    notifications: ov.notifications ?? task.notifications,
    notificationsEnabled: ov.notificationsEnabled ?? task.notificationsEnabled,
    completed: isRecurring ? !!ex?.completed : task.completed,
    completedAt: isRecurring ? ex?.completedAt ?? null : task.completedAt ?? null,
    isRecurring,
    task,
  };
}

// Expand all tasks into occurrences. Recurring series are limited to the
// [start, end] window; non-recurring tasks are always included so far-future
// one-off tasks still appear.
export function expandOccurrences(tasks: Task[], start: Date, end: Date): Occurrence[] {
  const out: Occurrence[] = [];
  for (const t of tasks) {
    if (t.recurrence) {
      for (const slot of recurrenceSlotDates(t, start, end)) {
        if (t.exceptions?.[slot]?.deleted) continue;
        out.push(buildOccurrence(t, slot));
      }
    } else {
      out.push(buildOccurrence(t, t.date));
    }
  }
  return out;
}

// Occurrences on a specific calendar day (used by the calendar views).
export function occurrencesOnDate(tasks: Task[], dateISO: string): Occurrence[] {
  const d = parseISODate(dateISO);
  return expandOccurrences(tasks, d, d).filter((o) => o.date === dateISO);
}

// All completed occurrences across history (finite: only explicit completions).
export function completedOccurrences(tasks: Task[]): Occurrence[] {
  const out: Occurrence[] = [];
  for (const t of tasks) {
    if (t.recurrence) {
      for (const [slot, ex] of Object.entries(t.exceptions ?? {})) {
        if (ex.completed && !ex.deleted) out.push(buildOccurrence(t, slot));
      }
    } else if (t.completed) {
      out.push(buildOccurrence(t, t.date));
    }
  }
  out.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  return out;
}

// Human summary of a recurrence rule, e.g. "Tous les jeudis".
export function recurrenceSummary(rec: Recurrence | null): string {
  if (!rec) return "Aucune";
  const interval = Math.max(1, rec.interval || 1);
  if (rec.freq === "daily") {
    if (rec.weekdaysOnly) return "Tous les jours ouvrés";
    return interval === 1 ? "Tous les jours" : `Tous les ${interval} jours`;
  }
  if (rec.freq === "weekly") {
    const days = rec.weekdays && rec.weekdays.length ? rec.weekdays : [];
    if (interval === 2 && days.length === 0) return "Toutes les 2 semaines";
    if (days.length) {
      const names = [...days].sort((a, b) => a - b).map((d) => WEEKDAY_LONG[d]);
      const prefix = interval === 1 ? "Chaque" : `Toutes les ${interval} sem. :`;
      return `${prefix} ${names.join(", ").toLowerCase()}`;
    }
    return interval === 1 ? "Toutes les semaines" : `Toutes les ${interval} semaines`;
  }
  // monthly
  const dayPart =
    rec.monthDay === "last"
      ? "le dernier jour"
      : `le ${typeof rec.monthDay === "number" ? rec.monthDay : ""}`;
  return interval === 1 ? `Tous les mois ${dayPart}` : `Tous les ${interval} mois ${dayPart}`;
}

export { fr };
