"use client";

import { useState } from 'react';

export default function Footer() {
    const [showModal, setShowModal] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowModal(true);
    };

    return (
        <>
            <footer className="border-t border-white/10 bg-[#030303] py-12 px-6">
                <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-8">
                    <div className="flex flex-col gap-4">
                        <div className="text-xl font-bold tracking-tight text-white">
                            Video<span className="text-purple-500 font-extrabold">Creator</span>
                        </div>
                        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                            Empowering creators with AI-driven video tools.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 md:col-span-2">
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Product</h4>
                            <a href="#" onClick={handleClick} className="text-sm text-zinc-500 hover:text-white transition-colors">Features</a>
                            <a href="#" onClick={handleClick} className="text-sm text-zinc-500 hover:text-white transition-colors">Pricing</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company</h4>
                            <a href="#" onClick={handleClick} className="text-sm text-zinc-500 hover:text-white transition-colors">About</a>
                            <a href="#" onClick={handleClick} className="text-sm text-zinc-500 hover:text-white transition-colors">Blog</a>
                        </div>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl border-t border-white/5 pt-8 flex flex-col md:flex-row md:justify-between items-center text-xs text-zinc-600 gap-4">
                    <p>&copy; {new Date().getFullYear()} VideoCreator. All rights reserved.</p>
                </div>
            </footer>

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
