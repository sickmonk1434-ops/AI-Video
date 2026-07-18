"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white transition-all hover:opacity-90">
            Video<span className="text-purple-500 font-extrabold">Creator</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" onClick={handleClick} className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">Features</a>
            <a href="#pricing" onClick={handleClick} className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">Pricing</a>
            <a href="#about" onClick={handleClick} className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">About</a>
          </nav>
          <div className="flex items-center gap-6">
            <a href="/login" onClick={handleClick} className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white">Sign In</a>
            <a href="/signup" onClick={handleClick} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black shadow-md shadow-white/5 transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 duration-200">Get Started</a>
          </div>
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 text-center shadow-2xl relative">
            {/* Ambient glow behind modal */}
            <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl -z-10 pointer-events-none" />
            
            <h3 className="text-xl font-bold text-white mb-3">Notice</h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              For info visit{" "}
              <a
                href="https://rupeesol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline font-semibold transition-colors"
              >
                rupeesol.com
              </a>
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all border border-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
