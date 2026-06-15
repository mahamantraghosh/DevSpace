"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code, Users, Plus, LogIn, X } from "lucide-react";

export default function Hero() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");

    // Load persisted username from local storage if available
    useEffect(() => {
        const savedUsername = localStorage.getItem("devspace-username");
        if (savedUsername) {
            Promise.resolve().then(() => {
                setUsername(savedUsername);
            });
        }
    }, []);

    const handleCreateRoom = () => {
        // Generate room code: e.g. room-abc-123
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const generatedId = `room-${part1}-${part2}`;
        router.push(`/room/${generatedId}`);
    };

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim()) return;

        if (username.trim()) {
            localStorage.setItem("devspace-username", username.trim());
        }
        
        router.push(`/room/${roomId.trim().toLowerCase()}`);
    };

    return (
        <section className="relative flex flex-col items-center justify-center text-center py-32 px-4 bg-gray-950 text-white overflow-hidden">
            {/* Background Glow effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold mb-8 animate-pulse">
                    <Code size={14} /> Live Real-Time Collaboration
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                    Real-Time <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                        Developer Playground
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10">
                    A collaborative coding platform where multiple users can join a shared room to write code together, communicate via chat, and view live output.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4 max-w-md">
                    <button 
                        onClick={handleCreateRoom}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
                    >
                        <Plus size={18} /> Create a Room
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-850 hover:border-gray-700 active:scale-[0.98] transition cursor-pointer"
                    >
                        <LogIn size={18} /> Join a Room
                    </button>
                </div>
            </div>

            {/* Glassmorphic Join Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div 
                        className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
                            <Users className="text-blue-400" size={20} /> Join an Existing Room
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">Enter a room code and set your username to collaborate.</p>

                        <form onSubmit={handleJoinSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-450 uppercase tracking-wider mb-2">Room Code / ID</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. room-abc-xyz"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-450 uppercase tracking-wider mb-2">Your Display Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. CodeWizard"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 mt-6"
                            >
                                <LogIn size={18} /> Join Playground
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}