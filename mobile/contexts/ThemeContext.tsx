import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { darkColors, lightColors, type ThemeColors } from "@/constants/colors";

const THEME_KEY = "rastro_color_scheme";

export type ColorScheme = "light" | "dark";

type ThemeContextValue = {
  scheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  setScheme: (next: ColorScheme) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function RastroThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>("light");

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "dark" || saved === "light") setSchemeState(saved);
      } catch {
        /* keep light */
      }
    })();
  }, []);

  const setScheme = useCallback((next: ColorScheme) => {
    setSchemeState(next);
    void AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === "dark" ? "light" : "dark");
  }, [scheme, setScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      isDark: scheme === "dark",
      colors: scheme === "dark" ? darkColors : lightColors,
      setScheme,
      toggleScheme,
    }),
    [scheme, setScheme, toggleScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useRastroTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useRastroTheme precisa estar dentro de RastroThemeProvider");
  }
  return ctx;
}

export function useThemedStyles<T>(factory: (colors: ThemeColors, isDark: boolean) => T): T {
  const { colors, isDark } = useRastroTheme();
  return useMemo(() => factory(colors, isDark), [colors, isDark, factory]);
}
