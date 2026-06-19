"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ScrollBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(1);
  const [virtualScroll, setVirtualScroll] = useState(0);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setMaxScroll(Math.max(document.documentElement.scrollHeight - window.innerHeight, 1));
    };

    const handleWheel = (e: WheelEvent) => {
      // If the page is not naturally scrollable, let's use the wheel event for virtual scrolling
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
    ? ["/dark_bg1.png", "/dark_bg2.png"]
    : [
      "https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg",
      "https://i.pinimg.com/236x/4d/24/ba/4d24ba454a84f7a9e67677e2b020b9c4.jpg"
    ];

  const isVirtual = typeof document !== "undefined" && document.documentElement.scrollHeight <= window.innerHeight + 10;
  const currentScroll = isVirtual ? virtualScroll : scrollY;
  const currentMaxScroll = isVirtual ? 1000 : maxScroll;

  const progress = Math.min(Math.max(currentScroll / currentMaxScroll, 0), 1);
  const parallax1 = currentScroll * 0.4; // Image 1 moves up
  const parallax2 = (currentScroll - currentMaxScroll) * 0.4; // Image 2 comes up from below

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none bg-[#fdf2f8]">
      <div
        className="absolute top-0 left-0 w-full h-[200vh] transition-opacity duration-300"
        style={{
          backgroundImage: `url('${images[0]}')`,
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          opacity: 1 - progress,
          transform: `translateY(-${parallax1}px)`
        }}
      />
      <div
        className="absolute top-0 left-0 w-full h-[200vh] transition-opacity duration-300"
        style={{
          backgroundImage: `url('${images[1]}')`,
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          opacity: progress,
          transform: `translateY(-${parallax2}px)`
        }}
      />
    </div>
  );
}
