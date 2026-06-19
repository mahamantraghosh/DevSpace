export default function FeatureGrid() {
    const features = [
        { title: "Real-time Code Editor", desc: "Write code together with zero latency using Monaco Editor." },
        { title: "Live Room Chat", desc: "Communicate seamlessly with your team while building." },
        { title: "Live Preview", desc: "Instantly see your HTML/CSS/JS render as you type." }
    ];

    return (
        <section className="py-20 bg-gray-900 text-white px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="p-8 bg-gray-950 border border-gray-800 rounded-xl hover:border-gray-600 transition">
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-gray-400">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
} 