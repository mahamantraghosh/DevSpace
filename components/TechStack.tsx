"use client";

import { Terminal } from "lucide-react";

const techs = [
  { name: "Next.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg", invertDark: true },
  { name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
  { name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
  { name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" },
  { name: "Express", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg", invertDark: true },
  { name: "Socket.io", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/socketio/socketio-original.svg", invertDark: true },
  { name: "MongoDB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" },
  { name: "Tailwind CSS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "HTML5", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg" },
  { name: "CSS3", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg" },
  { name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" },
];

export default function TechStack() {
  return (
    <section className="py-24 relative overflow-hidden border-t border-slate-200/50 dark:border-slate-800/50" id="tech-stack">
      {/* Background glow elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-pink-500/10 dark:bg-pink-500/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-4 inline-block tracking-tight">
            Powered By Modern Tech
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Built with a robust stack of cutting-edge technologies to ensure real-time performance, infinite scalability, and a flawless developer experience.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
          {techs.map((tech) => (
            <div 
              key={tech.name}
              className="flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-pink-500/20 dark:hover:shadow-pink-500/10 transition-all duration-300 group w-[130px] md:w-40"
            >
              <div className="h-14 w-14 mb-4 relative flex items-center justify-center">
                {/* Fallback to text if image fails is handled natively, but devicon is reliable */}
                <img 
                  src={tech.icon} 
                  alt={tech.name} 
                  className={`max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm ${tech.invertDark ? 'dark:invert' : ''}`}
                  loading="lazy"
                />
              </div>
              <span className="text-[13px] md:text-sm font-bold text-slate-800 dark:text-slate-200 text-center group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
          
          {/* Monaco Editor custom card since Devicon doesn't have a specific official SVG for it */}
          <div className="flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-pink-500/20 dark:hover:shadow-pink-500/10 transition-all duration-300 group w-[130px] md:w-40">
            <div className="h-14 w-14 mb-4 relative flex items-center justify-center bg-[#1e1e1e] rounded-xl shadow-inner border border-slate-700 transition-transform duration-300 group-hover:scale-110">
              <Terminal className="w-7 h-7 text-blue-400" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] md:text-sm font-bold text-slate-800 dark:text-slate-200 text-center group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
              Monaco Editor
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
