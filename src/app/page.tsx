"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Image as ImageIcon, Zap, Share2, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-20 py-8 lg:py-16">
      {/* 1. Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-panel border border-primary/20 text-xs font-bold text-primary animate-float">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Modern Campaigns
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Create Beautiful <br />
            <span className="gradient-text">Campaign Frames</span> <br />
            in Minutes
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            The premium open-source alternative to Twibbonize. Design custom overlays, share links instantly, and sync participant logs seamlessly into Google Sheets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  Create Your Campaign
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-panel border border-foreground/10 hover:bg-foreground/5 text-foreground font-bold text-sm transition-all active:scale-98 flex items-center justify-center"
                >
                  Explore Features
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 relative w-full max-w-[420px] aspect-square flex items-center justify-center select-none">
          {/* Animated Glow blobs */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse-slow" />
          
          <div className="relative z-10 glass-panel p-6 rounded-3xl border border-opacity-40 shadow-2xl w-full flex flex-col gap-4">
            {/* Visual Frame mock */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border border-opacity-20 flex items-center justify-center">
              
              {/* Fake user image */}
              <div className="h-4/5 w-4/5 rounded-full bg-cover bg-center bg-gradient-to-br from-indigo-300 to-purple-400 opacity-80" />

              {/* Fake Transparent PNG overlay */}
              <div className="absolute inset-0 border-[24px] border-primary/25 rounded-2xl flex flex-col justify-end p-4">
                <div className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-lg text-center border border-white/10 shadow-sm">
                  #CityCraftCreator
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Active Campaign</p>
                <h4 className="font-bold text-foreground text-sm">Designers United 2026</h4>
              </div>
              <div className="text-right">
                <span className="inline-block py-1 px-2 rounded-lg bg-green-500/15 border border-green-500/20 text-success text-[10px] font-extrabold uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Walkthrough Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            How City Craft <span className="gradient-text">Works</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Boost your product launches, community festivals, or political updates in three simple, automated steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-opacity-30 relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">1. Upload Custom Frame</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Design a transparent PNG frame (1080x1080px). Upload it along with a banner to instantly launch your campaign.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-opacity-30 relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">2. Share Unique URL</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Copy your auto-generated campaign link. Share it with your community, students, or team on WhatsApp and Twitter.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-opacity-30 relative overflow-hidden group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">3. Merge & Sync Data</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users enter details, upload their picture, drag-align it in real-time, and download. Their logs automatically sync to Google Sheets!
            </p>
          </div>
        </div>
      </section>

      {/* 3. Global Premium Stats banner */}
      <section className="glass-panel p-8 rounded-3xl border border-opacity-40 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-transparent opacity-40 pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-1">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">Instant</span>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Sheet Generation</span>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-x border-foreground/10 pt-4 sm:pt-0">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">100%</span>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Client Canvas Merges</span>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 pt-4 sm:pt-0">
            <span className="block text-3xl sm:text-4xl font-extrabold text-primary">HD 1080p</span>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">PNG Output Downloads</span>
          </div>
        </div>
      </section>
    </div>
  );
}
