import { addDays } from "date-fns";

import type { Occurrence, Task } from "@/src/types";
import { expandOccurrences } from "@/src/lib/recurrence";
import { parseISODate, todayISO } from "@/src/lib/dates";
import { PRIORITY_RANK } from "@/src/lib/priority";

const PAST_WINDOW = 60;
const FUTURE_WINDOW = 60;

export function windowRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: addDays(now, -PAST_WINDOW), end: addDays(now, FUTURE_WINDOW) };
}

export function sortByTime(a: Occurrence, b: Occurrence): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time && !b.time) return -1;
  if (!a.time && b.time) return 1;
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

export interface TodayGroups {
  overdue: Occurrence[];
  today: Occurrence[];
  later: Occurrence[];
  completedToday: Occurrence[];
  todayCount: number;
}

export function buildTodayGroups(tasks: Task[]): TodayGroups {
  const { start, end } = windowRange();
  const t = todayISO();
  const all = expandOccurrences(tasks, start, end);

  const overdue: Occurrence[] = [];
  const today: Occurrence[] = [];
  const later: Occurrence[] = [];
  const completedToday: Occurrence[] = [];

  for (const o of all) {
    if (o.completed) {
      if (o.date === t) completedToday.push(o);
      continue;
    }
    if (o.date < t) overdue.push(o);
    else if (o.date === t) today.push(o);
    else later.push(o);
  }

  overdue.sort(sortByTime);
  today.sort(sortByTime);
  later.sort(sortByTime);
  completedToday.sort(sortByTime);

  return { overdue, today, later, completedToday, todayCount: today.length };
}

export { parseISODate };
