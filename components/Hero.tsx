export default function Hero() {
    return (
        <section className="flex flex-col items-center justify-center text-center py-32 px-4 bg-gray-950 text-white">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Developer Playground</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10">
                A collaborative coding platform where multiple users can join a shared room to write code together, communicate via chat, and view live output.
            </p>
            <div className="flex gap-4">
                <button className="px-8 py-3 text-lg font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                    Create a Room
                </button>
                <button className="px-8 py-3 text-lg font-medium bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
                    Join a Room
                </button>
            </div>
        </section>
    );
}