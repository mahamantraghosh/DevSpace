"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function NavbarThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex flex-col items-center justify-center gap-1.5 group mt-1.5"
    >
      <div className={`w-14 h-7 rounded-full relative shadow-inner border-[1.5px] transition-all duration-300 flex items-center px-1 ${mounted && theme === 'dark' ? 'bg-slate-800/80 border-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]' : 'bg-white/80 border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_2px_8px_rgba(236,72,153,0.15)]'}`}>
        <div className={`w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-200 transform transition-transform duration-300 ${mounted && theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
           <span className="text-[11px] leading-none select-none">{mounted && theme === 'dark' ? '🌜' : '🌞'}</span>
        </div>
      </div>
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-pink-500 transition-colors drop-shadow-sm">Theme</span>
    </button>
  );
}
