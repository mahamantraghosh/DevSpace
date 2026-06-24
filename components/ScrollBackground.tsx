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

  const isVirtual = typeof document !== "undefined" && document.documentElement.scrollHeight <= window.innerHeight + 10;
  const currentScroll = isVirtual ? virtualScroll : scrollY;
  const currentMaxScroll = isVirtual ? 1000 : maxScroll;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const images = theme === "dark"
    ? ["/dark_bg1.png", "https://creator.nightcafe.studio/jobs/UMfJp2JtSK1zmB5C9bv5/UMfJp2JtSK1zmB5C9bv5--0--vuoem.jpg"]
    : [
      isMobile ? "/radha_krishna_light_cutout_v2.png" : "https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg",
      "https://paintwaint.in/cdn/shop/files/Background-2025-04-03T144407.378.png"
    ];

  const rawProgress = Math.min(Math.max(currentScroll / currentMaxScroll, 0), 1);

  // --- PROGRESS ---
  let progress = rawProgress;
  if (isMobile) {
    if (rawProgress < 0.4) {
      progress = 0;
    } else if (rawProgress > 0.6) {
      progress = 1;
    } else {
      progress = (rawProgress - 0.4) / 0.2;
    }
  }

  // --- PARALLAX & POSITIONS ---
  let parallax1 = 0;
  let parallax2 = 0;
  let bgPos1 = 0;
  let bgPos2 = 0;
  const imageTop = isMobile ? "17vh" : "5vh";
  let imageTop2 = imageTop;

  if (isMobile) {
    // Mobile-specific dynamic scrolling logic
    const transitionStart1 = currentMaxScroll * 0.5;
    const slideUpSpeed = 0.2;
    const slowScrollSpeed = 0.12;

    parallax1 = currentScroll > transitionStart1
      ? (transitionStart1 * slowScrollSpeed) + ((currentScroll - transitionStart1) * slideUpSpeed)
      : currentScroll * slowScrollSpeed;

    if (currentScroll < currentMaxScroll) {
      parallax2 = (currentScroll - currentMaxScroll) * slideUpSpeed;
    } else {
      parallax2 = (currentScroll - currentMaxScroll) * slowScrollSpeed;
    }

    if (theme === "light") {
      bgPos1 = currentScroll * 0.3;
      bgPos2 = currentScroll * 0.15;
      imageTop2 = "110vh";
    }
  } else {
    // Desktop Original d0a5226 Logic
    const parallaxFactor = 0.3;
    parallax1 = currentScroll * parallaxFactor;
    parallax2 = (currentScroll - currentMaxScroll) * parallaxFactor;
  }

  // --- SEAMLESS TEXTURES ---
  // In the original d0a5226 commit, AI textures were used universally across both themes and platforms
  const topPattern1 = theme === "dark" ? "url('/pattern_dark1_top.png')" : "url('/pattern_light1_top.png')";
  const topPattern2 = theme === "dark" ? "url('/pattern_dark2_top.png')" : "url('/pattern_light2_top.png')";

  const botPattern1 = theme === "dark" ? "url('/pattern_dark1_bot.png')" : "url('/cloud_pattern_light_1.png')";
  const botPattern2 = theme === "dark" ? "url('/pattern_dark2_bot.png')" : "url('/pattern_light2_bot.png')";

  // --- MASKING ---
  const maskStyle = isMobile
    ? "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)"
    : "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)";

  return (
    <>
      {/* Global Overlay to handle transparency and blur independently per page */}
      <div
        className={`fixed inset-0 pointer-events-none transition-all duration-1000 z-[-1] ${pathname === '/'
          ? 'bg-pink-200/40 dark:bg-white/5 dark:bg-opacity-10 backdrop-blur-[2px]'
          : pathname === '/dashboard'
            ? 'bg-pink-200/40 dark:bg-white/5 dark:bg-opacity-10 backdrop-blur-[1px]' // Dashboard specific blur
            : 'bg-transparent'
          }`}
      ></div>

      <div className="fixed inset-0 z-[-2] pointer-events-none">
        {/* Parallax wrapper 1 */}
        <div
          className="absolute top-0 left-0 w-full h-[200vh]"
          style={{ transform: isAuthPage ? undefined : `translateY(-${parallax1}px)` }}
        >
          <div className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 animate-nature-float" style={{ opacity: isAuthPage ? 1 : 1 - progress }}>
            {/* Base Background: Generated Seamless Bottom Texture */}
            <div className="absolute inset-0" style={{ backgroundImage: botPattern1, backgroundSize: "100% auto", backgroundRepeat: "repeat", backgroundPosition: `center -${bgPos1}px` }}></div>

            {/* Top Fade Background: Generated Seamless Top Texture fading downwards */}
            <div className="absolute top-0 left-0 w-full h-[60vh]" style={{
              backgroundImage: topPattern1,
              backgroundSize: "100% auto",
              backgroundRepeat: "repeat",
              backgroundPosition: `center -${bgPos1}px`,
              WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)"
            }}></div>

            {/* Image */}
            <div className="absolute left-0 w-full pointer-events-none" style={{ top: imageTop }}>
              <img
                src={images[0]}
                alt=""
                className="w-full h-auto"
                style={{
                  WebkitMaskImage: maskStyle,
                  maskImage: maskStyle
                }}
              />
            </div>
          </div>
        </div>
        {!isAuthPage && (
          <div
            className="absolute top-0 left-0 w-full h-[200vh]"
            style={{ transform: `translateY(-${parallax2}px)` }}
          >
            {/* Parallax wrapper 2 */}
            <div className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 animate-nature-float" style={{ opacity: progress }}>
              {/* Base Background: Generated Seamless Bottom Texture */}
              <div className="absolute inset-0" style={{ backgroundImage: botPattern2, backgroundSize: "100% auto", backgroundRepeat: "repeat", backgroundPosition: `center -${bgPos2}px` }}></div>

              {/* Top Fade Background: Generated Seamless Top Texture fading downwards */}
              <div className="absolute top-0 left-0 w-full h-[60vh]" style={{
                backgroundImage: topPattern2,
                backgroundSize: "100% auto",
                backgroundRepeat: "repeat",
                backgroundPosition: `center -${bgPos2}px`,
                WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)"
              }}></div>

              {/* Image */}
              <div className="absolute left-0 w-full pointer-events-none" style={{ top: imageTop2, transform: `translateY(-${bgPos2}px)` }}>
                <img
                  src={images[1]}
                  alt=""
                  className="w-full h-auto"
                  style={{
                    WebkitMaskImage: maskStyle,
                    maskImage: maskStyle
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
