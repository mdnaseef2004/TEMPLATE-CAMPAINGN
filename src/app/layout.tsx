import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { supabaseConfigured } from "@/supabase/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TwibbonCraft | Campaign Frame Generator",
  description: "Create premium frame campaigns, share links, and generate high-resolution transparent PNG frames in seconds.",
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
      <body className="min-h-full flex flex-col bg-background text-foreground relative selection:bg-primary-light selection:text-primary">
        <AuthProvider>
          {/* Supabase Setup Banner */}
          {!supabaseConfigured && (
            <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-2.5 px-4 text-center z-50 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>
                Supabase is not configured. Add your credentials to{" "}
                <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono">.env.local</code>{" "}
                to enable Authentication, Database, and Storage features.
              </span>
            </div>
          )}

          {/* Ambient Background Glowing Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-gradient-to-tr from-primary/10 to-pink-500/10 blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
          <div className="absolute bottom-[10%] right-[-10%] w-[45%] aspect-square rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />

          {/* Core App wrapper */}
          <Navbar />
          <main className="flex-1 flex flex-col relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          {/* Sticky footer */}
          <footer className="w-full glass-panel border-t border-opacity-10 py-6 mt-auto text-center text-xs text-muted-foreground z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} TwibbonCraft. Crafted with passion for modern campaigns.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

