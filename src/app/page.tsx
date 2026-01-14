"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export default function Home() {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        body: JSON.stringify({ concept }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate script");
      }

      // Save to storage for the review page
      if (typeof window !== "undefined") {
        localStorage.setItem("currentScript", JSON.stringify(data.script));
        localStorage.setItem("currentConcept", concept);
      }

      router.push("/review");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-2xl space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-purple-200 backdrop-blur-md">
            <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
            <span>AI Video Generator</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Turn Ideas into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-gradient">
              Reality
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Describe your story concept, and our AI will craft a script, voiceover, and video for you instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl shadow-2xl"
        >
          <div className="rounded-xl bg-card p-6 space-y-4">
            <Textarea
              placeholder="e.g. A futuristic city where plants glow at night, and a lone gardener discovers a secret underground forest..."
              className="min-h-[160px] resize-none bg-secondary/50 text-lg border-none focus-visible:ring-purple-500/50"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Powered by Gemini 1.5
              </span>
              <Button
                size="lg"
                onClick={handleGenerate}
                loading={loading}
                disabled={!concept.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
              >
                {!loading && <Wand2 className="mr-2 h-4 w-4" />}
                Generate Script
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-400 flex items-center mt-2">
                ⚠️ {error}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground pt-8"
        >
          <div>
            <strong className="block text-white">Scripts</strong>
            Gemini AI
          </div>
          <div>
            <strong className="block text-white">Voice</strong>
            ElevenLabs
          </div>
          <div>
            <strong className="block text-white">Visuals</strong>
            Hugging Face
          </div>
        </motion.div>
      </div>
    </main>
  );
}
