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
            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-col">
                        <div className="logo">VideoCreator</div>
                        <p className="footer-desc">
                            Empowering creators with AI-driven video tools.
                        </p>
                    </div>
                    <div className="footer-links">
                        <div className="col">
                            <h4>Product</h4>
                            <a href="#" onClick={handleClick}>Features</a>
                            <a href="#" onClick={handleClick}>Pricing</a>
                        </div>
                        <div className="col">
                            <h4>Company</h4>
                            <a href="#" onClick={handleClick}>About</a>
                            <a href="#" onClick={handleClick}>Blog</a>
                        </div>
                    </div>
                </div>
                <div className="container footer-bottom">
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
