"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Video, ArrowLeft, RefreshCw, Edit3, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface Panel {
    panel_id: number;
    visual_description: string;
    dialogue: string;
    speaker: string;
    imageUrl: string;
}

interface ComicData {
    comicId: string;
    title: string;
    description: string;
    style: string;
    panels: Panel[];
}

export default function ComicsPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [panelCount, setPanelCount] = useState(4);
    const [style, setStyle] = useState("Comic Book Art");
    const [loading, setLoading] = useState(false);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [comic, setComic] = useState<ComicData | null>(null);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [editSpeaker, setEditSpeaker] = useState("");
    const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");

    const handleGenerateComic = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setComic(null);

        try {
            const res = await fetch("/api/generate-comic", {
                method: "POST",
                body: JSON.stringify({ prompt, panelCount, style }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate comic strip");

            setComic(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = (idx: number) => {
        if (!comic) return;
        const updatedPanels = [...comic.panels];
        updatedPanels[idx] = {
            ...updatedPanels[idx],
            dialogue: editText,
            speaker: editSpeaker
        };
        setComic({ ...comic, panels: updatedPanels });
        setEditIdx(null);
    };

    const startEdit = (idx: number, panel: Panel) => {
        setEditIdx(idx);
        setEditText(panel.dialogue);
        setEditSpeaker(panel.speaker);
    };

    // Helper: Load an image URL into an HTMLImageElement
    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Crucial to avoid canvas tainted/CORS issues
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });
    };

    // Helper: Render panel illustration + speech bubble/banner onto an offscreen canvas
    const drawPanelToCanvas = async (panel: Panel, isVertical: boolean): Promise<string> => {
        const img = await loadImage(panel.imageUrl);
        const canvas = document.createElement("canvas");
        const width = isVertical ? 720 : 1280;
        const height = isVertical ? 1280 : 720;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        // 1. Draw solid background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // 2. Draw panel image (contain aspect ratio)
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let dx = 0, dy = 0, dw = width, dh = height;

        if (imgRatio > canvasRatio) {
            dh = width / imgRatio;
            dy = (height - dh) / 2;
        } else {
            dw = height * imgRatio;
            dx = (width - dw) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);

        // 3. Draw Speech Bubble / Narration overlay if dialogue exists
        if (panel.dialogue && panel.dialogue.trim() !== "") {
            const padding = 20;
            ctx.font = isVertical ? "bold 24px sans-serif" : "bold 28px sans-serif";

            // Word wrap helper
            const words = panel.dialogue.split(" ");
            const lines: string[] = [];
            let currentLine = words[0];
            const maxTextWidth = width - 100;

            for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + " " + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxTextWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            const lineHeight = isVertical ? 34 : 38;
            const textHeight = lines.length * lineHeight;
            const bubbleWidth = Math.min(width - 60, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
            const bubbleHeight = textHeight + padding * 2;

            ctx.save();
            const isNarrator = panel.speaker.toLowerCase() === "narrator";

            if (isNarrator) {
                // Draw yellow classic comic narration banner at top
                const bx = (width - bubbleWidth) / 2;
                const by = 30;

                ctx.fillStyle = "#fef08a"; // yellow-200
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                ctx.fillRect(bx, by, bubbleWidth, bubbleHeight);
                ctx.strokeRect(bx, by, bubbleWidth, bubbleHeight);

                // Text
                ctx.fillStyle = "#000000";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                lines.forEach((line, idx) => {
                    ctx.fillText(line, width / 2, by + padding + idx * lineHeight);
                });
            } else {
                // Draw white rounded speech bubble at bottom
                const bx = (width - bubbleWidth) / 2;
                const by = height - bubbleHeight - 80;

                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                
                // Rounded rect
                ctx.beginPath();
                ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, 18);
                ctx.fill();
                ctx.stroke();

                // Draw tail pointing down
                ctx.beginPath();
                ctx.moveTo(width / 2 - 15, by + bubbleHeight - 2);
                ctx.lineTo(width / 2, by + bubbleHeight + 20);
                ctx.lineTo(width / 2 + 15, by + bubbleHeight - 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                
                // Draw tail outline
                ctx.beginPath();
                ctx.moveTo(width / 2 - 15, by + bubbleHeight - 2);
                ctx.lineTo(width / 2, by + bubbleHeight + 20);
                ctx.lineTo(width / 2 + 15, by + bubbleHeight - 2);
                ctx.stroke();

                // Speaker Tag Badge
                if (panel.speaker) {
                    ctx.font = "bold 14px sans-serif";
                    const badgeWidth = ctx.measureText(panel.speaker.toUpperCase()).width + 16;
                    ctx.fillStyle = "#7c3aed"; // purple-600
                    ctx.beginPath();
                    ctx.roundRect(bx + 16, by - 12, badgeWidth, 24, 6);
                    ctx.fill();
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(panel.speaker.toUpperCase(), bx + 16 + badgeWidth / 2, by);
                }

                // Dialogue text
                ctx.font = isVertical ? "bold 24px sans-serif" : "bold 28px sans-serif";
                ctx.fillStyle = "#000000";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                lines.forEach((line, idx) => {
                    ctx.fillText(line, width / 2, by + padding + idx * lineHeight);
                });
            }
            ctx.restore();
        }

        return canvas.toDataURL("image/png");
    };

    const handleConvertToVideo = async () => {
        if (!comic) return;
        setConverting(true);
        setError(null);

        try {
            console.log("Stitching panels onto canvas...");
            const processedPanels = [];
            const isVertical = aspectRatio === "9:16";

            for (const panel of comic.panels) {
                // Generate base64 representation of comic panel with dialogue overlay drawn
                const canvasBase64 = await drawPanelToCanvas(panel, isVertical);
                processedPanels.push({
                    ...panel,
                    imageUrl: canvasBase64 // Override original image with text-baked canvas
                });
            }

            const res = await fetch("/api/convert-comic", {
                method: "POST",
                body: JSON.stringify({
                    title: comic.title,
                    panels: processedPanels,
                    aspectRatio
                }),
                headers: { "Content-Type": "application/json" }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to convert comic to video");

            router.push(`/watch/${data.renderId}`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to compile comic video. Please try again.");
            setConverting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 pb-24 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[130px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[130px]" />
            </div>

            <div className="mx-auto max-w-5xl space-y-8 relative z-10">
                {/* Header Back Link */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Choice
                    </button>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-300">
                            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> Comic Generator
                        </span>
                    </div>
                </div>

                {/* Prompt Panel */}
                {!comic && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl transition hover:border-indigo-500/30"
                    >
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Create a Comic Strip</h2>
                        <p className="text-zinc-400 text-sm mb-6">
                            Gemini will build the characters, plot, and script. Then, Imagen will compile the panels in your selected style.
                        </p>
                        <div className="space-y-6">
                            <Textarea
                                placeholder="Describe your comic story concept (e.g. A funny incident where an astronaut cat discovers a cheese-like crater on the Moon)..."
                                className="min-h-[120px] resize-none border-white/10 bg-black/50 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/50"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={loading}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Comic Panels Count</label>
                                    <select
                                        value={panelCount}
                                        onChange={(e) => setPanelCount(parseInt(e.target.value))}
                                        disabled={loading}
                                        className="w-full h-11 bg-black border border-white/10 rounded-xl px-3 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500/30 outline-none"
                                    >
                                        <option value={4}>4 Panels (Classic short strip)</option>
                                        <option value={6}>6 Panels (Medium story)</option>
                                        <option value={8}>8 Panels (Extended narrative)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Illustrative Style</label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        disabled={loading}
                                        className="w-full h-11 bg-black border border-white/10 rounded-xl px-3 text-sm text-white focus:border-indigo-500 focus:ring-indigo-500/30 outline-none"
                                    >
                                        <option value="Comic Book Art">Comic Book Art (Vibrant Ink)</option>
                                        <option value="Manga / Anime">Manga / Anime (Cel Shaded)</option>
                                        <option value="Retro Pop Art">Retro Pop Art (Polka Dot Shading)</option>
                                        <option value="Dark Noir Illustration">Dark Noir Illustration (High Contrast)</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                onClick={handleGenerateComic}
                                disabled={loading || !prompt.trim()}
                                className="h-14 w-full bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all rounded-xl"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" /> Drafting panels & compiling art (Takes ~30s)...
                                    </span>
                                ) : "Generate Comic Page"}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Main Comic Viewer Panel */}
                {comic && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        {/* Title and Description */}
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-extrabold text-white">{comic.title}</h2>
                            <p className="text-zinc-400 text-sm max-w-xl mx-auto">{comic.description}</p>
                        </div>

                        {/* Panels Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {comic.panels.map((panel, idx) => (
                                <div
                                    key={panel.panel_id}
                                    className="relative rounded-2xl border border-white/10 bg-zinc-900/40 p-4 shadow-xl flex flex-col justify-between overflow-hidden group"
                                >
                                    {/* Panel Badge */}
                                    <span className="absolute top-6 left-6 z-20 bg-black/80 backdrop-blur border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-400">
                                        PANEL_{panel.panel_id}
                                    </span>

                                    {/* Panel Image Container */}
                                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5 mb-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={panel.imageUrl}
                                            alt={`Panel ${panel.panel_id}`}
                                            className="w-full h-full object-contain"
                                        />

                                        {/* Live Preview Overlay bubble (just for visualization) */}
                                        <div className="absolute inset-x-0 bottom-4 px-4 pointer-events-none">
                                            {panel.speaker.toLowerCase() === "narrator" ? (
                                                <div className="bg-yellow-200 border-2 border-black text-black px-3 py-1.5 text-xs font-bold text-center rounded shadow-md mx-auto max-w-[90%]">
                                                    {panel.dialogue}
                                                </div>
                                            ) : (
                                                <div className="bg-white border-2 border-black text-black px-3 py-1.5 text-xs font-bold text-center rounded-xl shadow-md mx-auto max-w-[90%] relative">
                                                    {panel.speaker && (
                                                        <span className="absolute -top-3 left-3 bg-purple-600 text-white text-[8px] font-bold rounded px-1 py-0.5">
                                                            {panel.speaker.toUpperCase()}
                                                        </span>
                                                    )}
                                                    {panel.dialogue}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit Dialogues block */}
                                    <div className="space-y-3">
                                        {editIdx === idx ? (
                                            <div className="space-y-2 border border-white/10 rounded-xl p-3 bg-black/60">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editSpeaker}
                                                        onChange={(e) => setEditSpeaker(e.target.value)}
                                                        placeholder="Speaker (e.g. Narrator, Cat)"
                                                        className="h-8 bg-zinc-800 border border-white/10 rounded px-2 text-xs text-white outline-none focus:border-indigo-500 w-1/3"
                                                    />
                                                    <span className="text-[10px] text-zinc-500 self-center">Use 'Narrator' for yellow banners</span>
                                                </div>
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full min-h-[60px] bg-zinc-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(idx)}
                                                        className="bg-green-600 hover:bg-green-500 text-white text-[10px] h-7 px-2 font-bold flex gap-1 rounded"
                                                    >
                                                        <Check className="h-3 w-3" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between bg-black/20 rounded-xl p-3 border border-white/5">
                                                <div className="text-xs">
                                                    <strong className="block text-indigo-400 font-mono text-[10px] mb-1">
                                                        {panel.speaker.toUpperCase()} DIALOGUE:
                                                    </strong>
                                                    <p className="text-zinc-300 italic">"{panel.dialogue}"</p>
                                                </div>
                                                <button
                                                    onClick={() => startEdit(idx, panel)}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                    title="Edit dialogue"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Video Convert Section */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Video className="h-5 w-5 text-indigo-400" /> Compile Video Clip
                                </h3>
                                <p className="text-zinc-400 text-xs leading-relaxed max-w-lg">
                                    Export your comic strip panel slides into a synced, animated video clip suited for Instagram Reels, YouTube Shorts, or YouTube widescreen uploads.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="flex border border-white/10 rounded-xl overflow-hidden h-11 bg-black w-full sm:w-auto">
                                    <button
                                        onClick={() => setAspectRatio("9:16")}
                                        className={`px-4 text-xs font-bold transition-colors ${aspectRatio === "9:16" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"}`}
                                    >
                                        Reels / Shorts (9:16)
                                    </button>
                                    <button
                                        onClick={() => setAspectRatio("16:9")}
                                        className={`px-4 text-xs font-bold transition-colors ${aspectRatio === "16:9" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"}`}
                                    >
                                        Widescreen (16:9)
                                    </button>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={handleConvertToVideo}
                                    disabled={converting}
                                    className="h-11 bg-white text-black hover:bg-zinc-200 font-bold px-6 shadow-md transition-all flex gap-2 w-full sm:w-auto justify-center rounded-xl"
                                >
                                    {converting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> Compiling video...
                                        </>
                                    ) : (
                                        <>
                                            Convert to Video
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Regenerate Trigger */}
                        <div className="text-center pt-4">
                            <button
                                onClick={() => setComic(null)}
                                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-semibold"
                            >
                                <RefreshCw className="h-3 w-3" /> Create another comic
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400"
                    >
                        {error}
                    </motion.div>
                )}
            </div>
        </main>
    );
}
