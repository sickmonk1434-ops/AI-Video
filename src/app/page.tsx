"use client";

import { motion } from "framer-motion";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 overflow-hidden relative">
      {/* Ambient background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-purple-900/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-blue-900/15 rounded-full blur-[130px]" />
      </div>

      <div className="z-10 w-full max-w-4xl space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 animate-gradient">Creation Mode</span>
          </h1>
          <p className="mx-auto max-w-xl text-zinc-400 text-base sm:text-lg leading-relaxed">
            Select an engine below to start transforming your imagination into cinematic videos or panel-by-panel comic strips.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Card 1: AI Video Creator */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            whileHover={{ y: -8 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">AI Video Creator</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Describe your story concept, and let the AI compile a script, high-quality voiceover, and full animated video sequence automatically.
            </p>
            <Link
              href="/video"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500 hover:scale-105 active:scale-95 duration-200"
            >
              Start Generating <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Card 2: AI Comic Creator */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            whileHover={{ y: -8 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">AI Comic Creator</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Generate full comic strips (4-8 panels) with detailed dialogue, consistent characters, and layout overlays. Convert your pages into reels.
            </p>
            <Link
              href="/comics"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 duration-200"
            >
              Create Comic Strip <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
