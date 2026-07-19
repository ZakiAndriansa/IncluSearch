// Selectable sidebar themes. Each theme is a set of Tailwind class strings so
// the sidebar can restyle itself entirely from a single key.

export type NavThemeKey = "olive" | "forest" | "deepspace" | "moonstone" | "light";

export interface NavTheme {
  key: NavThemeKey;
  label: string;
  swatch: string; // small color chip in the picker
  panel: string; // aside background + border
  divider: string; // section separators
  navText: string; // inactive label
  navIcon: string; // inactive icon
  navHover: string; // hover state
  active: string; // active item
  activeIcon: string; // active icon
  accentBg: string; // "Pakar" badge + statistik card background
  accentText: string; // their text/icon color
}

export const NAV_THEMES: Record<NavThemeKey, NavTheme> = {
  olive: {
    key: "olive",
    label: "Olive",
    swatch: "bg-olive-500",
    panel: "bg-olive-500 border-forest-700",
    divider: "border-white/10",
    navText: "text-sand-100",
    navIcon: "text-sand-200",
    navHover: "hover:bg-white/10 hover:text-white",
    active: "bg-white text-forest-600 shadow-sm",
    activeIcon: "text-forest-600",
    accentBg: "bg-teal-light",
    accentText: "text-white",
  },
  forest: {
    key: "forest",
    label: "Hijau Gelap",
    swatch: "bg-forest-500",
    panel: "bg-forest-500 border-forest-700",
    divider: "border-white/10",
    navText: "text-sand-100",
    navIcon: "text-sand-200",
    navHover: "hover:bg-white/10 hover:text-white",
    active: "bg-white text-forest-600 shadow-sm",
    activeIcon: "text-forest-600",
    accentBg: "bg-teal-light",
    accentText: "text-white",
  },
  deepspace: {
    key: "deepspace",
    label: "Deep Space",
    swatch: "bg-teal-dark",
    panel: "bg-teal-dark border-teal-dark",
    divider: "border-white/15",
    navText: "text-white/80",
    navIcon: "text-white/70",
    navHover: "hover:bg-white/10 hover:text-white",
    active: "bg-white text-teal-dark shadow-sm",
    activeIcon: "text-teal-dark",
    accentBg: "bg-white",
    accentText: "text-teal-dark",
  },
  moonstone: {
    key: "moonstone",
    label: "Moonstone",
    swatch: "bg-teal-light",
    panel: "bg-teal-light border-teal-dark/30",
    divider: "border-white/40",
    navText: "text-forest-700",
    navIcon: "text-forest-600",
    navHover: "hover:bg-white/40 hover:text-forest-700",
    active: "bg-forest-500 text-white shadow-sm",
    activeIcon: "text-white",
    accentBg: "bg-white",
    accentText: "text-forest-600",
  },
  light: {
    key: "light",
    label: "Putih",
    swatch: "bg-white border border-sand-300",
    panel: "bg-white border-sand-200",
    divider: "border-sand-200",
    navText: "text-sand-700",
    navIcon: "text-sand-500",
    navHover: "hover:bg-sand-100 hover:text-forest-500",
    active: "bg-forest-500 text-white shadow-sm",
    activeIcon: "text-white",
    accentBg: "bg-forest-50",
    accentText: "text-forest-600",
  },
};

// Ordered lightest → darkest for the theme picker.
export const NAV_THEME_LIST: NavTheme[] = [
  NAV_THEMES.light,
  NAV_THEMES.moonstone,
  NAV_THEMES.olive,
  NAV_THEMES.deepspace,
  NAV_THEMES.forest,
];
export const DEFAULT_NAV_THEME: NavThemeKey = "light";
