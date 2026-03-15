import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, type ThemeColors } from "@/constants/theme-colors";

export type ThemeMode = "light" | "dark";
export { LightColors, DarkColors, type ThemeColors };

const THEME_KEY = "dkd_theme_mode_v2";

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  colors: LightColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDark: false,
  isLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") setMode(saved);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(THEME_KEY, mode);
  }, [mode, loaded]);

  const colors = useMemo(() => (mode === "dark" ? DarkColors : LightColors), [mode]);

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleTheme: () => setMode((m) => (m === "dark" ? "light" : "dark")),
      setThemeMode: setMode,
      isDark: mode === "dark",
      isLoaded: loaded,
    }),
    [mode, colors, loaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
