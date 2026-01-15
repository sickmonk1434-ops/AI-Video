"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Loader2, Share2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function WatchPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [status, setStatus] = useState<"queued" | "fetching" | "rendering" | "done" | "failed">("fetching");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/video-status?id=${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Failed to check status");

                const renderStatus = data.response.status; // queued, fetching, rendering, saving, done, failed

                if (renderStatus === "done") {
                    setVideoUrl(data.response.url);
                    setStatus("done");
                } else if (renderStatus === "failed") {
                    setStatus("failed");
                    setError("Render failed on Shotstack servers.");
                } else {
                    setStatus("rendering");
                    // Poll again in 3 seconds
                    setTimeout(checkStatus, 3000);
                }

            } catch (err: any) {
                console.error(err);
                setError(err.message);
                setStatus("failed");
            }
        };

        checkStatus();
    }, [id]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[150px]" />
            </div>

            <div className="z-10 max-w-4xl w-full space-y-8">
                {status === "rendering" || status === "fetching" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center space-y-6"
                    >
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-t-4 border-purple-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-purple-400 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Generating Your Masterpiece</h2>
                        <p className="text-muted-foreground animate-pulse">
                            Stitching scenes, syncing audio, and rendering effects...
                        </p>
                    </motion.div>
                ) : status === "done" && videoUrl ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-center space-x-2 text-primary font-bold mb-4 tracking-wider">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                            <span className="text-lg text-neon">RENDER COMPLETE</span>
                        </div>

                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/50 bg-black shadow-[0_0_50px_rgba(57,255,20,0.3)]">
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <Button
                                size="lg"
                                className="bg-primary text-black font-bold h-12 px-8 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all"
                                onClick={() => window.open(videoUrl, '_blank')}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download Video
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white/10 text-white hover:bg-white/10 h-12 px-8"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("Link copied to clipboard!");
                                }}
                            >
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                                onClick={() => router.push('/')}
                            >
                                Create Another
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl font-bold text-red-500">Generation Failed</h2>
                        <p className="text-muted-foreground">{error || "Something went wrong during the rendering process."}</p>
                        <Button onClick={() => router.push('/')}>Try Again</Button>
                    </motion.div>
                )}
            </div >
        </div >
    );
}
