"use client";

import { useState, useRef, useEffect } from "react";

const PLAYLIST = [
  { title: "Tum Se Hi", src: "/tum-se-hi.mp3" },
  { title: "Kingdom Dance", src: "/kingdom-dance.mp3" }
];

export default function GlobalMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentTrack = PLAYLIST[currentTrackIndex];

  // Auto-play next track when current one ends
  const handleTrackEnd = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  // Play immediately when track changes if already playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrackIndex, isPlaying]);

  // Handle auto-play and event listeners
  useEffect(() => {
    // Attempt auto-play
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Autoplay blocked by browser. User interaction needed.", err);
        setIsPlaying(false);
        
        // Autoplay workaround: wait for the first user interaction anywhere on the page
        const handleFirstInteraction = () => {
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              // Pause any other players that might be running
              window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
            }).catch(() => {
              // Silently catch if the browser still rejects it
            });
          }
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
          document.removeEventListener('pointerdown', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        document.addEventListener('pointerdown', handleFirstInteraction);
      });
    }

    // Listen for other audio players starting (like the interactive preview)
    const handlePauseAudio = (e: any) => {
      if (e.detail?.source !== 'global' && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('pause-audio', handlePauseAudio);
    return () => window.removeEventListener('pause-audio', handlePauseAudio);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Dispatch event to pause other players before we start playing
      window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-2 pr-4 rounded-full shadow-lg shadow-pink-500/10 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 group" 
      onClick={togglePlay}
    >
      <audio ref={audioRef} src={currentTrack.src} onEnded={handleTrackEnd} preload="auto" autoPlay />
      
      {/* Mini spinning vinyl disc */}
      <div className={`relative shrink-0 w-10 h-10 rounded-full bg-slate-800 border-[2px] border-slate-900 shadow-md flex items-center justify-center overflow-hidden ${isPlaying ? 'animate-spin [animation-duration:3s]' : 'transition-transform duration-500'}`}>
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
      
      {/* Title & Status */}
      <div className="flex flex-col min-w-[80px]">
        <select 
          value={currentTrackIndex}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setCurrentTrackIndex(Number(e.target.value));
            if (!isPlaying) {
              window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'global' } }));
              setIsPlaying(true);
            }
          }}
          className="text-[12px] font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer appearance-none truncate leading-tight group-hover:text-pink-600 transition-colors -ml-1 pl-1"
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
          onClick={handlePrev}
          className="p-1 rounded-full text-slate-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
        </button>
        <button 
          onClick={handleNext}
          className="p-1 rounded-full text-slate-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        </button>
      </div>
    </div>
  );
}
