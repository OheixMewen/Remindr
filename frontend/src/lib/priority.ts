import type { Priority } from "@/src/types";
import type { ThemeColors } from "@/src/theme";

export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Importante",
  urgent: "Urgente",
};

export function priorityColor(colors: ThemeColors, p: Priority): string {
  switch (p) {
    case "low":
      return colors.priorityLow;
    case "normal":
      return colors.priorityNormal;
    case "high":
      return colors.priorityHigh;
    case "urgent":
      return colors.priorityUrgent;
  }
}

// Rank for sorting: urgent first.
export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};
