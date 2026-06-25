import Link from "next/link";
import Image from "next/image";

export default function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition-transform duration-500 z-50 flex items-center justify-center">
        <img src="/logo.png" alt="MantraCode Logo" className="w-full h-full object-contain drop-shadow-md" />
      </div>
      <span className="font-black text-xl tracking-tight text-black dark:text-white group-hover:text-pink-500 transition-colors drop-shadow-md">
        Mantra<span className="text-pink-500">Code</span>
      </span>
    </Link>
  );
}
