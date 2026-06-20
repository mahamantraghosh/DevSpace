import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import CursorTrail from "@/components/CursorTrail";
import ScrollBackground from "@/components/ScrollBackground";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer";
import { Analytics } from "@vercel/analytics/next";

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
  icons: {
    icon: '/icon.png?v=8',
  },
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
      <head>
        {/* Suppress Next.js dev overlay for harmless Monaco Editorr cancelation errors before Next.js initializes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener("unhandledrejection", function(event) {
                if (event.reason && typeof event.reason === "object") {
                  if (event.reason.type === "cancelation" || event.reason.name === "Canceled" || event.reason.msg === "operation is manually canceled") {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-foreground relative" suppressHydrationWarning>
        <ThemeProvider>
          <ScrollBackground />
          <AuthProvider>
            <Toaster position="top-center" />
            <ThemeToggle />
            <CursorTrail />
            <GlobalMusicPlayer />
            <div className="relative z-0 flex flex-col min-h-full flex-1">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
