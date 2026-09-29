import type { Task } from "@/src/types";
import { todayISO, tomorrowISO } from "@/src/lib/dates";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeSeedTasks(): Task[] {
  const now = new Date().toISOString();
  const today = todayISO();
  const tomorrow = tomorrowISO();
  const base = {
    completed: false,
    completedAt: null,
    recurrenceEndDate: null,
    notifications: [],
    notificationsEnabled: true,
    exceptions: {},
    createdAt: now,
    updatedAt: now,
  };
  return [
    {
      id: uid(),
      title: "Arroser les plantes",
      notes: "",
      date: today,
      time: "18:00",
      priority: "low",
      recurrence: null,
      ...base,
    },
    {
      id: uid(),
      title: "Faire les courses",
      notes: "",
      date: today,
      time: "19:00",
      priority: "normal",
      recurrence: null,
      ...base,
    },
    {
      id: uid(),
      title: "Appeler le médecin",
      notes: "",
      date: tomorrow,
      time: "10:00",
      priority: "high",
      recurrence: null,
      ...base,
      notifications: [{ id: uid(), offsetMinutes: 60 }],
    },
    {
      id: uid(),
      title: "Envoyer le dossier",
      notes: "",
      date: tomorrow,
      time: "16:00",
      priority: "urgent",
      recurrence: null,
      ...base,
      notifications: [{ id: uid(), offsetMinutes: 1440 }],
    },
    {
      id: uid(),
      title: "Sortir les poubelles",
      notes: "",
      date: today,
      time: "20:00",
      priority: "normal",
      recurrence: { freq: "weekly", interval: 1, weekdays: [4] }, // Thursday
      ...base,
    },
  ];
}

export { uid };
