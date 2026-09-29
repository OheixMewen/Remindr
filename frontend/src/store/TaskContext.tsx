import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import type { Occurrence, OccurrenceOverride, Priority, Recurrence, Reminder, Task } from "@/src/types";
import { storage } from "@/src/utils/storage";
import { useSettings } from "@/src/store/SettingsContext";
import { makeSeedTasks, uid } from "@/src/lib/seed";
import { cancelTaskNotifications, syncTaskNotifications } from "@/src/lib/notifications";
import { todayISO, tomorrowISO } from "@/src/lib/dates";

const TASKS_KEY = "tasks.v1";
const SEEDED_KEY = "seeded.v1";

export interface NewTaskInput {
  title: string;
  notes?: string;
  date: string;
  time: string | null;
  priority: Priority;
  recurrence: Recurrence | null;
  recurrenceEndDate?: string | null;
  notifications: Reminder[];
  notificationsEnabled: boolean;
}

interface TaskContextValue {
  tasks: Task[];
  loaded: boolean;
  getTask: (id: string) => Task | undefined;
  addTask: (input: NewTaskInput) => Task;
  updateSeries: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  toggleComplete: (occ: Occurrence) => void;
  editOccurrence: (occ: Occurrence, override: OccurrenceOverride) => void;
  deleteOccurrence: (occ: Occurrence) => void;
  moveOccurrence: (occ: Occurrence, newDateISO: string) => void;
  postponeOccurrence: (occ: Occurrence) => void;
  clearAllData: () => void;
  exportTasks: () => string;
  importTasks: (json: string) => boolean;
  resyncAllNotifications: () => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    (async () => {
      const seeded = await storage.getItem<boolean>(SEEDED_KEY, false);
      let stored = await storage.getItem<Task[]>(TASKS_KEY, []);
      if (!seeded) {
        stored = makeSeedTasks();
        await storage.setItem(TASKS_KEY, stored);
        await storage.setItem(SEEDED_KEY, true);
      }
      setTasks(stored ?? []);
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next: Task[]) => {
    storage.setItem(TASKS_KEY, next);
  }, []);

  const commit = useCallback(
    (updater: (prev: Task[]) => Task[], syncIds?: string[]) => {
      setTasks((prev) => {
        const next = updater(prev);
        persist(next);
        if (syncIds) {
          for (const id of syncIds) {
            const t = next.find((x) => x.id === id);
            if (t) syncTaskNotifications(t, settingsRef.current);
          }
        }
        return next;
      });
    },
    [persist],
  );

  const getTask = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks]);

  const addTask = useCallback(
    (input: NewTaskInput): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        id: uid(),
        title: input.title.trim(),
        notes: input.notes ?? "",
        date: input.date,
        time: input.time,
        priority: input.priority,
        completed: false,
        completedAt: null,
        recurrence: input.recurrence,
        recurrenceEndDate: input.recurrenceEndDate ?? null,
        notifications: input.notifications,
        notificationsEnabled: input.notificationsEnabled,
        exceptions: {},
        createdAt: now,
        updatedAt: now,
      };
      commit((prev) => [...prev, task], [task.id]);
      return task;
    },
    [commit],
  );

  const updateSeries = useCallback(
    (id: string, patch: Partial<Task>) => {
      commit(
        (prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
          ),
        [id],
      );
    },
    [commit],
  );

  const deleteTask = useCallback(
    (id: string) => {
      cancelTaskNotifications(id);
      commit((prev) => prev.filter((t) => t.id !== id));
    },
    [commit],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const src = tasks.find((t) => t.id === id);
      if (!src) return;
      const now = new Date().toISOString();
      const copy: Task = {
        ...src,
        id: uid(),
        title: `${src.title} (copie)`,
        completed: false,
        completedAt: null,
        exceptions: {},
        createdAt: now,
        updatedAt: now,
      };
      commit((prev) => [...prev, copy], [copy.id]);
    },
    [commit, tasks],
  );

  const toggleComplete = useCallback(
    (occ: Occurrence) => {
      const now = new Date().toISOString();
      commit((prev) =>
        prev.map((t) => {
          if (t.id !== occ.taskId) return t;
          if (!t.recurrence) {
            return {
              ...t,
              completed: !t.completed,
              completedAt: t.completed ? null : now,
              updatedAt: now,
            };
          }
          const ex = { ...(t.exceptions ?? {}) };
          const cur = ex[occ.originalDate] ?? {};
          const nowCompleted = !cur.completed;
          ex[occ.originalDate] = {
            ...cur,
            completed: nowCompleted,
            completedAt: nowCompleted ? now : null,
          };
          return { ...t, exceptions: ex, updatedAt: now };
        }),
      );
    },
    [commit],
  );

  const editOccurrence = useCallback(
    (occ: Occurrence, override: OccurrenceOverride) => {
      const now = new Date().toISOString();
      commit((prev) =>
        prev.map((t) => {
          if (t.id !== occ.taskId) return t;
          if (!t.recurrence) {
            // Non-recurring: edit the task directly.
            return {
              ...t,
              title: override.title ?? t.title,
              notes: override.notes ?? t.notes,
              time: override.time !== undefined ? override.time : t.time,
              priority: override.priority ?? t.priority,
              date: override.date ?? t.date,
              notifications: override.notifications ?? t.notifications,
              notificationsEnabled: override.notificationsEnabled ?? t.notificationsEnabled,
              updatedAt: now,
            };
          }
          const ex = { ...(t.exceptions ?? {}) };
          const cur = ex[occ.originalDate] ?? {};
          ex[occ.originalDate] = {
            ...cur,
            overrides: { ...(cur.overrides ?? {}), ...override },
          };
          return { ...t, exceptions: ex, updatedAt: now };
        }),
      );
    },
    [commit],
  );

  const deleteOccurrence = useCallback(
    (occ: Occurrence) => {
      if (!occ.isRecurring) {
        deleteTask(occ.taskId);
        return;
      }
      const now = new Date().toISOString();
      commit((prev) =>
        prev.map((t) => {
          if (t.id !== occ.taskId) return t;
          const ex = { ...(t.exceptions ?? {}) };
          ex[occ.originalDate] = { ...(ex[occ.originalDate] ?? {}), deleted: true };
          return { ...t, exceptions: ex, updatedAt: now };
        }),
      );
    },
    [commit, deleteTask],
  );

  const moveOccurrence = useCallback(
    (occ: Occurrence, newDateISO: string) => {
      if (!occ.isRecurring) {
        updateSeries(occ.taskId, { date: newDateISO });
        return;
      }
      editOccurrence(occ, { date: newDateISO });
    },
    [editOccurrence, updateSeries],
  );

  const postponeOccurrence = useCallback(
    (occ: Occurrence) => {
      moveOccurrence(occ, tomorrowISO());
    },
    [moveOccurrence],
  );

  const clearAllData = useCallback(() => {
    for (const t of tasks) cancelTaskNotifications(t.id);
    setTasks([]);
    storage.setItem(TASKS_KEY, []);
    storage.setItem(SEEDED_KEY, true);
  }, [tasks]);

  const exportTasks = useCallback(() => JSON.stringify(tasks, null, 2), [tasks]);

  const importTasks = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) return false;
        commit(() => parsed as Task[]);
        return true;
      } catch {
        return false;
      }
    },
    [commit],
  );

  const resyncAllNotifications = useCallback(() => {
    for (const t of tasks) syncTaskNotifications(t, settingsRef.current);
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loaded,
        getTask,
        addTask,
        updateSeries,
        deleteTask,
        duplicateTask,
        toggleComplete,
        editOccurrence,
        deleteOccurrence,
        moveOccurrence,
        postponeOccurrence,
        clearAllData,
        exportTasks,
        importTasks,
        resyncAllNotifications,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}

void todayISO;
