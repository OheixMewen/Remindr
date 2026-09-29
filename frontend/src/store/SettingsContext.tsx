import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { AppSettings, ThemeMode } from "@/src/types";
import { storage } from "@/src/utils/storage";
import { setColorScheme } from "@/src/theme";

const SETTINGS_KEY = "settings.v1";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  notificationsEnabled: true,
  defaultReminderOffset: 0,
  soundEnabled: true,
  overdueNotifications: true,
  defaultPriority: "normal",
  defaultTime: null,
};

function applyTheme(mode: ThemeMode) {
  if (mode === "auto") setColorScheme(null);
  else setColorScheme(mode);
}

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
      const merged = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
      setSettings(merged);
      applyTheme(merged.theme);
      setLoaded(true);
    })();
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.theme) applyTheme(patch.theme);
      storage.setItem(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
