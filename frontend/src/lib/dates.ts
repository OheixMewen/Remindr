import {
  addDays,
  format,
  isSameDay,
  isThisWeek,
  parseISO,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

// All dates in the app are stored as "yyyy-MM-dd" (local calendar day) and
// times as "HH:mm". Helpers keep everything in the device local timezone.

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function tomorrowISO(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd");
}

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Parse a "yyyy-MM-dd" into a Date at local midnight.
export function parseISODate(s: string): Date {
  return startOfDay(parseISO(s));
}

// Combine a "yyyy-MM-dd" date and optional "HH:mm" time into a Date.
export function combineDateTime(dateISO: string, time: string | null): Date {
  const d = parseISODate(dateISO);
  if (time) {
    const [h, m] = time.split(":").map((n) => parseInt(n, 10));
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(23, 59, 59, 0); // no-time tasks are "due" end of day for overdue logic
  }
  return d;
}

// "18:30" -> "18h30", "09:00" -> "9h"
export function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hh = parseInt(h, 10);
  return m === "00" ? `${hh}h` : `${hh}h${m}`;
}

// "15 octobre 2026"
export function formatDateLong(dateISO: string): string {
  return format(parseISODate(dateISO), "d MMMM yyyy", { locale: fr });
}

// "lundi 15 octobre"
export function formatDateFull(dateISO: string): string {
  return format(parseISODate(dateISO), "EEEE d MMMM", { locale: fr });
}

// "Mardi 15 oct." short
export function formatDateMedium(dateISO: string): string {
  return format(parseISODate(dateISO), "EEE d MMM", { locale: fr });
}

// Human relative label: Aujourd'hui / Demain / Hier / date
export function relativeDateLabel(dateISO: string): string {
  const d = parseISODate(dateISO);
  const today = startOfDay(new Date());
  if (isSameDay(d, today)) return "Aujourd'hui";
  if (isSameDay(d, addDays(today, 1))) return "Demain";
  if (isSameDay(d, addDays(today, -1))) return "Hier";
  return capitalize(format(d, "EEEE d MMMM", { locale: fr }));
}

export function isToday(dateISO: string): boolean {
  return isSameDay(parseISODate(dateISO), startOfDay(new Date()));
}

export function isThisWeekISO(dateISO: string): boolean {
  return isThisWeek(parseISODate(dateISO), { weekStartsOn: 1 });
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const WEEKDAY_LONG = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
// Monday-first order for weekly pickers.
export const WEEKDAY_ORDER_MON = [1, 2, 3, 4, 5, 6, 0];
