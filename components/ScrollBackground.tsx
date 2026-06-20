"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function ScrollBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(1);
  const [virtualScroll, setVirtualScroll] = useState(0);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setMaxScroll(Math.max(document.documentElement.scrollHeight - window.innerHeight, 1));
    };

    const handleWheel = (e: WheelEvent) => {
      // If thee page is not naturally scrollable, let's use the wheel event for virtual scrolling
      if (document.documentElement.scrollHeight <= window.innerHeight + 10) {
        setVirtualScroll(prev => {
          const newScroll = prev + e.deltaY;
          return Math.max(0, Math.min(newScroll, 1000)); // 1000px virtual scroll depth
        });
      } else {
        setVirtualScroll(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("wheel", handleWheel);
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  if (!mounted) return null;

  const images = theme === "dark"
    ? ["dark_bg1.png", "https://creator.nightcafe.studio/jobs/UMfJp2JtSK1zmB5C9bv5/UMfJp2JtSK1zmB5C9bv5--0--vuoem.jpg"]
    : [
      "https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg",
      "https://paintwaint.in/cdn/shop/files/Background-2025-04-03T144407.378.png"
    ];

  const isVirtual = typeof document !== "undefined" && document.documentElement.scrollHeight <= window.innerHeight + 10;
  const currentScroll = isVirtual ? virtualScroll : scrollY;
  const currentMaxScroll = isVirtual ? 1000 : maxScroll;

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const progress = Math.min(Math.max(currentScroll / currentMaxScroll, 0), 1);
  const parallax1 = currentScroll * 0.4;
  const parallax2 = (currentScroll - currentMaxScroll) * 0.4;

  return (
    <>
      {/* Global Overlay to handle transparency and blur independently per page */}
      <div
        className={`fixed inset-0 pointer-events-none transition-all duration-1000 z-[-1] ${pathname === '/'
          ? 'bg-pink-200/40 dark:bg-white/5 dark:bg-opacity-10 backdrop-blur-[4px]'
          : pathname === '/dashboard'
            ? 'bg-pink-200/40 dark:bg-white/5 dark:bg-opacity-10 backdrop-blur-[0px]' // Dashboard specific blur
            : 'bg-transparent'
          }`}
      ></div>

      <div className="fixed inset-0 z-[-2] pointer-events-none bg-[#f9a8d4] dark:bg-slate-950">
        {/* Parallax wrapper 1 */}
        <div
          className="absolute top-0 left-0 w-full h-[200vh]"
          style={{ transform: isAuthPage ? undefined : `translateY(-${parallax1}px)` }}
        >
          <div
            className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 animate-nature-float"
            style={{
              backgroundImage: `url('${images[0]}')`,
              backgroundSize: "100% auto",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
              opacity: isAuthPage ? 1 : 1 - progress,
            }}
          />
        </div>
        {!isAuthPage && (
          <div
            className="absolute top-0 left-0 w-full h-[200vh]"
            style={{ transform: `translateY(-${parallax2}px)` }}
          >
            {/* Parallax wrapper 2 */}
            <div
              className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 animate-nature-float"
              style={{
                backgroundImage: `url('${images[1]}')`,
                backgroundSize: "100% auto",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                opacity: progress,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
