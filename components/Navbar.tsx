import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between p-6 bg-gray-950 text-white border-b border-gray-800">
            <div className="text-2xl font-bold tracking-tighter">DevSpace</div>
            <div className="space-x-4">
                <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Sign In</button>
                <button className="px-4 py-2 text-sm bg-blue-600 rounded-md hover:bg-blue-700 transition">Get Started</button>
            </div>
        </nav>
    );
}