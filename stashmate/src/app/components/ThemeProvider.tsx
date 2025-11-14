"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // default to dark

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme") as Theme | null;
    const initial: Theme = stored ?? "dark";

    setTheme(initial);
    document.body.classList.remove("light", "dark");
    document.body.classList.add(initial);
  }, []);

  const toggleTheme = () => {
    if (typeof window === "undefined") return;

    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.body.classList.remove("light", "dark");
      document.body.classList.add(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
