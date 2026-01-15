"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Film, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface Scene {
    segment_id: number;
    visual_description: string;
    voiceover: string;
}

interface Script {
    title: string;
    description: string;
    scenes: Scene[];
}

const LoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-neon-glow backdrop-blur-md">
        <div className="w-full max-w-md space-y-8 p-6 text-center border border-white/10 rounded-2xl bg-black/80 shadow-2xl">
            <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary opacity-20 blur-xl" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-primary bg-black">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white tracking-wider">SYSTEM PROCESSING</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-mono border-b border-white/10 pb-2">
                        <span className="text-gray-400">ANALYSIS</span>
                        <span className="text-primary text-neon">COMPLETE</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-mono border-b border-white/10 pb-2">
                        <span className="text-gray-400">VOICE_SYNTHESIS</span>
                        <span className="animate-pulse text-primary">PROCESSING...</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-mono">
                        <span className="text-gray-400">RENDER_ENGINE</span>
                        <span className="text-gray-600">WAITING</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 animate-[shimmer_2s_infinite] rounded-full bg-primary shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                </div>
            </div>
        </div>
    </div>
);

export default function ReviewPage() {
    // ... existing hooks ...
    const router = useRouter();
    const [script, setScript] = useState<Script | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // ... existing useEffect and update handlers ...
    useEffect(() => {
        const saved = localStorage.getItem("currentScript");
        if (saved) {
            try {
                setScript(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse script", e);
            }
        }
    }, []);

    const handleUpdateScene = (index: number, field: keyof Scene, value: string) => {
        if (!script) return;
        const newScenes = [...script.scenes];
        newScenes[index] = { ...newScenes[index], [field]: value };
        setScript({ ...script, scenes: newScenes });
    };

    const handleConfirm = async () => {
        if (!script) return;
        setIsGenerating(true);

        try {
            const payload = { title: script.title, scenes: script.scenes };
            const res = await fetch('/api/generate-video', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");

            router.push(`/watch/${data.renderId}`);

        } catch (error) {
            console.error(error);
            alert("Failed to start video generation");
            setIsGenerating(false); // Only stop loading on error, otherwise keep it during redirect
        }
    };

    if (!script) return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Loading script...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 pb-32 bg-neon-glow relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {isGenerating && <LoadingOverlay />}

            <div className="mx-auto max-w-4xl space-y-8 relative z-10">
                <header className="flex items-center justify-between border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-black tracking-tighter text-white">
                        REVIEW <span className="text-primary text-neon">SCRIPT</span>
                    </h1>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleConfirm}
                            disabled={isGenerating}
                            className="bg-black border border-primary text-purple-400 font-bold shadow-[0_0_10px_rgba(57,255,20,0.2)] hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all"
                        >
                            {isGenerating ? "Processing..." : "Generate Video"}
                        </Button>
                        <Button variant="ghost" className="text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    </div>
                </header>

                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold text-white">{script.title}</h2>
                    <p className="text-muted-foreground">{script.description}</p>
                </div>

                <div className="space-y-6">
                    {script.scenes.map((scene, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-primary/30 hover:bg-white/10"
                        >
                            {/* Scene ID Badge */}
                            <div className="absolute -right-4 -top-4 h-16 w-16 rotate-12 bg-white/5 transition-colors group-hover:bg-primary/10" />
                            <span className="absolute right-4 top-4 font-mono text-xs text-gray-500 group-hover:text-primary">
                                SCENE_{String(idx + 1).padStart(2, '0')}
                            </span>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Visual Prompt (For AI Image Gen)
                                    </label>
                                    <Textarea
                                        value={scene.visual_description}
                                        onChange={(e) => handleUpdateScene(idx, "visual_description", e.target.value)}
                                        className="min-h-[120px] bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Voiceover (For AI TTS)
                                    </label>
                                    <Textarea
                                        value={scene.voiceover}
                                        onChange={(e) => handleUpdateScene(idx, "voiceover", e.target.value)}
                                        className="min-h-[120px] bg-secondary/30"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Inline Button Fallback */}
                <div className="flex justify-center pt-8 md:hidden">
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        disabled={isGenerating}
                        className="w-full bg-black border-2 border-primary text-purple-400 font-bold shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-primary/10 hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] transition-all"
                    >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        {isGenerating ? "PROCESSING..." : "CONFIRM & GENERATE"}
                    </Button>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-lg border-t border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        disabled={isGenerating}
                        className="bg-black border-2 border-primary text-purple-400 font-black tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-primary/10 hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] hover:text-purple-300 transition-all duration-300"
                    >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        {isGenerating ? "PROCESSING..." : "CONFIRM & GENERATE"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
