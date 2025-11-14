"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="theme-toggle-btn">
      {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    </button>
  );
};

export default ThemeToggle;
