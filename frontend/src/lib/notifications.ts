import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { AppSettings, Task } from "@/src/types";
import { storage } from "@/src/utils/storage";
import { recurrenceSlotDates } from "@/src/lib/recurrence";
import { addDays, format, startOfDay } from "date-fns";
import { parseISODate } from "@/src/lib/dates";

export const CHANNEL_ID = "reminders";

// Register once at module load, before scheduling/receiving.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type PermissionState = "granted" | "denied" | "blocked" | "unsupported";

export async function prepareNotifications(): Promise<PermissionState> {
  if (Platform.OS === "web") return "unsupported";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Rappels de tâches",
      description: "Rappels programmés pour vos tâches",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.status === "granted") return "granted";

  const requested = await Notifications.requestPermissionsAsync();
  if (requested.granted || requested.status === "granted") return "granted";
  return requested.canAskAgain === false ? "blocked" : "denied";
}

export async function getPermissionState(): Promise<PermissionState> {
  if (Platform.OS === "web") return "unsupported";
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.status === "granted") return "granted";
  return current.canAskAgain === false ? "blocked" : "denied";
}

export async function openNotificationSettings() {
  if (Platform.OS !== "web") await Linking.openSettings();
}

const notifKey = (taskId: string) => `notif:${taskId}`;

export async function cancelTaskNotifications(taskId: string) {
  if (Platform.OS === "web") return;
  const ids = (await storage.getItem<string[]>(notifKey(taskId), [])) ?? [];
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
  await storage.removeItem(notifKey(taskId));
}

function reminderLabel(offset: number): string {
  if (offset <= 0) return "Maintenant";
  if (offset < 60) return `Dans ${offset} min`;
  if (offset < 1440) return `Dans ${Math.round(offset / 60)} h`;
  return `Dans ${Math.round(offset / 1440)} j`;
}

// Schedule (or reschedule) all local notifications for a task.
export async function syncTaskNotifications(task: Task, settings: AppSettings) {
  if (Platform.OS === "web") return;
  await cancelTaskNotifications(task.id);

  if (!settings.notificationsEnabled) return;
  if (!task.notificationsEnabled) return;
  if (!task.time) return; // reminders require a time
  const reminders = task.notifications.length ? task.notifications : [{ id: "at", offsetMinutes: 0 }];

  const perm = await getPermissionState();
  if (perm !== "granted") return;

  const [h, m] = task.time.split(":").map((n) => parseInt(n, 10));
  const ids: string[] = [];
  const content = (label: string) => ({
    title: "🔔 Rappel",
    body: label ? `${label} : ${task.title}` : task.title,
    data: { taskId: task.id },
    sound: settings.soundEnabled ? ("default" as const) : undefined,
    ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
  });

  try {
    if (!task.recurrence) {
      // One-time: schedule a DATE trigger for each reminder offset in the future.
      const due = new Date();
      const base = parseISODate(task.date);
      due.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
      due.setHours(h, m, 0, 0);
      for (const r of reminders) {
        const when = new Date(due.getTime() - r.offsetMinutes * 60000);
        if (when.getTime() <= Date.now()) continue;
        const id = await Notifications.scheduleNotificationAsync({
          content: content(task.title),
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
        ids.push(id);
      }
    } else {
      // Recurring: schedule same-day offsets as repeating calendar triggers.
      const rec = task.recurrence;
      for (const r of reminders) {
        const totalMin = h * 60 + m - r.offsetMinutes;
        if (totalMin < 0) continue; // skip day-crossing offsets for recurring
        const rh = Math.floor(totalMin / 60);
        const rm = totalMin % 60;
        if (rec.freq === "daily") {
          const id = await Notifications.scheduleNotificationAsync({
            content: content(task.title),
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: rh,
              minute: rm,
            },
          });
          ids.push(id);
        } else if (rec.freq === "weekly") {
          const weekdays =
            rec.weekdays && rec.weekdays.length
              ? rec.weekdays
              : [parseISODate(task.date).getDay()];
          for (const wd of weekdays) {
            const id = await Notifications.scheduleNotificationAsync({
              content: content(task.title),
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: (wd % 7) + 1, // expo: 1=Sunday..7=Saturday
                hour: rh,
                minute: rm,
              },
            });
            ids.push(id);
          }
        } else if (rec.freq === "monthly") {
          const day =
            rec.monthDay === "last"
              ? 28
              : typeof rec.monthDay === "number"
                ? Math.min(rec.monthDay, 28)
                : Math.min(parseISODate(task.date).getDate(), 28);
          const id = await Notifications.scheduleNotificationAsync({
            content: content(task.title),
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
              day,
              hour: rh,
              minute: rm,
            },
          });
          ids.push(id);
        }
      }
    }
    await storage.setItem(notifKey(task.id), ids);
  } catch {
    // Scheduling failures are non-fatal.
  }
}

export { reminderLabel };

// Preset reminder offsets (minutes before due time).
export const REMINDER_PRESETS: { label: string; offsetMinutes: number }[] = [
  { label: "À l'heure prévue", offsetMinutes: 0 },
  { label: "5 minutes avant", offsetMinutes: 5 },
  { label: "15 minutes avant", offsetMinutes: 15 },
  { label: "30 minutes avant", offsetMinutes: 30 },
  { label: "1 heure avant", offsetMinutes: 60 },
  { label: "2 heures avant", offsetMinutes: 120 },
  { label: "1 jour avant", offsetMinutes: 1440 },
];

export function offsetLabel(offset: number): string {
  const preset = REMINDER_PRESETS.find((p) => p.offsetMinutes === offset);
  if (preset) return preset.label;
  if (offset < 60) return `${offset} min avant`;
  if (offset < 1440) return `${Math.round(offset / 60)} h avant`;
  return `${Math.round(offset / 1440)} j avant`;
}

// Silence unused import warnings for helpers kept for future use.
void addDays;
void format;
void startOfDay;
void recurrenceSlotDates;
void reminderLabel;
