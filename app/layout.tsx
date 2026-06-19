import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import CursorTrail from "@/components/CursorTrail";
import ScrollBackground from "@/components/ScrollBackground";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MantraCode - Real-Time IDE",
  description: "A collaborative real-time editor by Mahamantra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col text-foreground relative">
        <ThemeProvider>
          <ScrollBackground />
          <div className="fixed inset-0 bg-white/10 backdrop-blur-sm pointer-events-none z-[-1]" />
          <AuthProvider>
            <Toaster position="top-center" />
            <ThemeToggle />
            <CursorTrail />
            <div className="relative z-0 flex flex-col min-h-full flex-1">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
