import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-950 font-sans">
            <Navbar />
            <Hero />
            <FeatureGrid />
        </main>
    );
}