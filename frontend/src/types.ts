export type Priority = "low" | "normal" | "high" | "urgent";

export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: RecurrenceFreq;
  interval: number; // every N units
  weekdays?: number[]; // 0=Sun..6=Sat (weekly)
  weekdaysOnly?: boolean; // daily business days (skip Sat/Sun)
  monthDay?: number | "last"; // monthly: day-of-month or "last"
}

export interface Reminder {
  id: string;
  offsetMinutes: number; // minutes before due time; 0 = at time
}

export interface OccurrenceOverride {
  title?: string;
  notes?: string;
  time?: string | null;
  priority?: Priority;
  date?: string; // moved date YYYY-MM-DD
  notifications?: Reminder[];
  notificationsEnabled?: boolean;
}

export interface OccurrenceException {
  completed?: boolean;
  completedAt?: string | null;
  deleted?: boolean;
  overrides?: OccurrenceOverride;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  date: string; // anchor date YYYY-MM-DD
  time: string | null; // HH:mm or null
  priority: Priority;
  completed: boolean; // non-recurring only
  completedAt?: string | null;
  recurrence: Recurrence | null;
  recurrenceEndDate?: string | null; // YYYY-MM-DD
  notifications: Reminder[];
  notificationsEnabled: boolean;
  exceptions?: Record<string, OccurrenceException>; // key: original slot YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// A concrete instance of a task on a given date (recurring series are expanded).
export interface Occurrence {
  key: string; // `${taskId}::${originalDate}`
  taskId: string;
  originalDate: string; // recurrence slot date (key into exceptions)
  date: string; // effective date (may be moved)
  time: string | null;
  title: string;
  notes?: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  isRecurring: boolean;
  notifications: Reminder[];
  notificationsEnabled: boolean;
  task: Task;
}

export type ThemeMode = "light" | "dark" | "auto";

export interface AppSettings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  defaultReminderOffset: number | null; // minutes before, null = none
  soundEnabled: boolean;
  overdueNotifications: boolean;
  defaultPriority: Priority;
  defaultTime: string | null; // HH:mm or null
}
