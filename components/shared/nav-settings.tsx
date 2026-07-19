"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_NAV_THEME, NAV_THEMES, type NavThemeKey } from "@/lib/nav-themes";

interface NavSettings {
  theme: NavThemeKey;
  setTheme: (t: NavThemeKey) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const NavSettingsCtx = createContext<NavSettings | null>(null);

export function useNavSettings(): NavSettings {
  const ctx = useContext(NavSettingsCtx);
  if (!ctx) throw new Error("useNavSettings must be used within <NavSettingsProvider>");
  return ctx;
}

export function NavSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<NavThemeKey>(DEFAULT_NAV_THEME);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // ephemeral (mobile drawer)

  // Restore persisted preferences on mount.
  useEffect(() => {
    const t = localStorage.getItem("navTheme");
    if (t && t in NAV_THEMES) setThemeState(t as NavThemeKey);
    setCollapsed(localStorage.getItem("navCollapsed") === "1");
  }, []);

  function setTheme(t: NavThemeKey) {
    setThemeState(t);
    localStorage.setItem("navTheme", t);
  }
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("navCollapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <NavSettingsCtx.Provider
      value={{ theme, setTheme, collapsed, toggleCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </NavSettingsCtx.Provider>
  );
}
