import Link from "next/link";
import Image from "next/image";

export default function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="w-8 h-8 rounded-lg bg-white/30 dark:bg-slate-800/80 border border-white/50 dark:border-slate-500/70 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm backdrop-blur-sm overflow-hidden p-1">
        <img src="/logo.png" alt="MantraCode Logo" className="w-full h-full object-contain drop-shadow-sm" />
      </div>
      <span className="font-black text-xl tracking-tight text-black dark:text-white group-hover:text-pink-700 transition-colors drop-shadow-md">
        Mantra<span className="text-pink-600">Code</span>
      </span>
    </Link>
  );
}
