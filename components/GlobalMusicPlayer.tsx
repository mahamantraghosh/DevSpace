"use client";

import { useState, useRef, useEffect } from "react";

const PLAYLIST = [
  { title: "Tum Se Hi", src: "/tum-se-hi.mp3" },
  { title: "Kingdom Dance", src: "/kingdom-dance.mp3" }
];

// SINGLETON AUDIO INSTANCE
// This sits entirely outside the React lifecycle. It mathematically guarantees
// that no matter how many times Next.js hot-reloads or Strict Mode unmounts/remounts
// the component, there is only EVER one audio engine running in the background.
const getGlobalAudio = () => {
  if (typeof window === 'undefined') return null;
  if (!(window as any).__devspace_global_audio) {
    const audio = new Audio();
    audio.preload = "auto";
    (window as any).__devspace_global_audio = audio;
  }
  return (window as any).__devspace_global_audio as HTMLAudioElement;
};

export default function GlobalMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });
  const [mounted, setMounted] = useState(false);
  
  const currentTrack = PLAYLIST[currentTrackIndex];

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("devspace-music-pos");
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Main Audio Engine Controller
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;

    // Sync React state with the native audio engine
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // If the audio source has changed, update it and play if it was already playing
    if (audio.src !== window.location.origin + currentTrack.src) {
      audio.src = currentTrack.src;
      audio.load();
      
      // Auto-play attempt on first load or track change
      audio.play().catch((err) => {
        // Autoplay workaround: wait for the first user interaction anywhere on the page
        const removeListeners = () => {
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('touchend', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
          document.removeEventListener('pointerdown', handleFirstInteraction);
        };

        const handleFirstInteraction = () => {
          if (audio.paused) {
            audio.play().then(() => {
              window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
              removeListeners();
            }).catch(() => {
              // Browser blocked this specific event type (e.g. touchstart). 
              // Do not remove listeners; let the next event (e.g. click) try again!
            });
          } else {
            removeListeners();
          }
        };
        
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('touchend', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        document.addEventListener('pointerdown', handleFirstInteraction);
      });
    }

    // Listen for other audio players starting (like the interactive preview)
    const handleGlobalPauseEvent = (e: any) => {
      if (e.detail?.source !== 'global') {
        audio.pause();
      }
    };
    window.addEventListener('pause-audio', handleGlobalPauseEvent);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('pause-audio', handleGlobalPauseEvent);
    };
  }, [currentTrackIndex]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.hasMoved = true;
    }
    
    // Calculate new position relative to bottom-left
    let newX = dragRef.current.initialX + dx;
    let newY = dragRef.current.initialY - dy;
    
    // Bounds checking
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (dragRef.current.hasMoved) {
      localStorage.setItem("devspace-music-pos", JSON.stringify(position));
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (dragRef.current.hasMoved) return; 
    setIsExpanded(!isExpanded);
  };

  const togglePlay = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    const audio = getGlobalAudio();
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
        audio.play().catch(() => {});
      }
    }
  };

  const handleNext = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  if (!mounted) return null;

  return (
    <div 
      className={`fixed z-50 flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-full shadow-lg shadow-pink-500/10 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 overflow-hidden group select-none touch-none light-liquid-glass ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105'} ${isExpanded ? 'max-w-[350px] p-2 pr-4 gap-3' : 'max-w-[56px] p-2 gap-0'}`}
      style={{ left: `${position.x}px`, bottom: `${position.y}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleContainerClick}
    >
      {/* Mini spinning vinyl disc */}
      <div 
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        className={`relative shrink-0 w-10 h-10 rounded-full bg-slate-800 border-[2px] border-slate-900 shadow-md flex items-center justify-center overflow-hidden cursor-pointer ${isPlaying ? 'animate-spin [animation-duration:3s]' : 'transition-transform duration-500'}`}
      >
        <div className="absolute inset-0 rounded-full border border-slate-700 m-[2px]"></div>
        <div className="absolute inset-0 rounded-full border border-slate-700 m-[6px]"></div>
        <div className="absolute top-0.5 right-1 text-pink-400 drop-shadow-md rotate-45 z-0">
          <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"/></svg>
        </div>
        <div className="absolute top-0 right-1/2 w-3 h-0.5 bg-white/20 rounded-full blur-[1px]"></div>
        <div className="relative w-3 h-3 bg-pink-500 rounded-full border border-pink-400 shadow-inner flex items-center justify-center z-10">
          <div className="w-0.5 h-0.5 bg-white/80 rounded-full shadow-sm"></div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <div className={`flex items-center gap-3 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Title & Status */}
        <div className="flex flex-col min-w-[80px]">
          <select 
            value={currentTrackIndex}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              setCurrentTrackIndex(Number(e.target.value));
              const audio = getGlobalAudio();
              if (audio && audio.paused) {
                window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
                audio.play().catch(() => {});
              }
            }}
            className="text-[12px] font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer appearance-none truncate leading-tight hover:text-pink-600 transition-colors -ml-1 pl-1"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23ec4899' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', paddingRight: '14px' }}
          >
            {PLAYLIST.map((t, i) => (
              <option key={i} value={i} className="text-slate-800 bg-white">{t.title}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPlaying ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-[9px] font-mono text-pink-600 font-bold uppercase tracking-widest">Playing</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Paused</span>
              </>
            )}
          </div>
        </div>

        {/* Track Navigation */}
        <div className="flex items-center gap-1 border-l border-slate-300/50 dark:border-slate-600/50 pl-2 ml-1">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePrev}
            className="p-1.5 rounded-full text-slate-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all cursor-pointer liquid-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={togglePlay}
            className="p-1.5 rounded-full text-slate-800 dark:text-slate-200 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all cursor-pointer liquid-button"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>

          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleNext}
            className="p-1.5 rounded-full text-slate-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all cursor-pointer liquid-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
