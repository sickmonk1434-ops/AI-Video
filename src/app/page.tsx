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
          className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl transition hover:border-primary/50"
        >
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your video concept..."
              className="min-h-[120px] resize-none border-white/10 bg-black/50 text-lg text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/50"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={loading}
            />
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !concept.trim()}
              className="h-14 w-full bg-primary text-black text-lg font-bold hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all"
            >
              {loading ? "Generating..." : "Generate Video"}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
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
