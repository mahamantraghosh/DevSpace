"use client";

import { useTheme } from "next-themes";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full border border-pink-200 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:text-pink-600 dark:hover:text-pink-400 transition-all shadow-lg hover:scale-110 cursor-pointer"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle Themee"
    >
      <Zap className="w-5 h-5" />
    </button>
  );
}
