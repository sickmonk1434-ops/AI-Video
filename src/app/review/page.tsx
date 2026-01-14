"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Film, PlayCircle } from "lucide-react";
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

export default function ReviewPage() {
    const router = useRouter();
    const [script, setScript] = useState<Script | null>(null);
    const [loading, setLoading] = useState(false);

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
        setLoading(true);

        try {
            // Prepare payload
            const payload = {
                title: script.title,
                scenes: script.scenes
            };

            // Call backend to start generation
            const res = await fetch('/api/generate-video', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Generation failed");

            // Redirect to watch page
            router.push(`/watch/${data.renderId}`);

        } catch (error) {
            console.error(error);
            alert("Failed to start video generation");
        } finally {
            setLoading(false);
        }
    };

    if (!script) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
                Loading script...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 text-foreground pb-24">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Script Review
                    </h1>
                    <div className="w-24" /> {/* Spacer */}
                </div>

                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold text-white">{script.title}</h2>
                    <p className="text-muted-foreground">{script.description}</p>
                </div>

                {/* Scenes List */}
                <div className="space-y-6">
                    {script.scenes.map((scene, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="rounded-xl border border-white/10 bg-card p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <span className="flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                    <Film className="mr-2 h-3 w-3" /> Scene {idx + 1}
                                </span>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Visual Prompt (For AI Image Gen)
                                    </label>
                                    <Textarea
                                        value={scene.visual_description}
                                        onChange={(e) =>
                                            handleUpdateScene(idx, "visual_description", e.target.value)
                                        }
                                        className="min-h-[120px] bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Voiceover (For AI TTS)
                                    </label>
                                    <Textarea
                                        value={scene.voiceover}
                                        onChange={(e) =>
                                            handleUpdateScene(idx, "voiceover", e.target.value)
                                        }
                                        className="min-h-[120px] bg-secondary/30"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        loading={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-green-900/20 shadow-lg"
                    >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Confirm & Generate Video
                    </Button>
                </div>
            </div>
        </div>
    );
}
