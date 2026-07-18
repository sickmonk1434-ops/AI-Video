const SLEEP = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try Gemini Imagen 4 (fast tier).
 * Returns image Buffer on success, null on any failure.
 */
async function tryImagen(prompt: string): Promise<Buffer | null> {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return null;

    const models = ["imagen-4.0-fast-generate-001", "imagen-4.0-generate-001"];
    for (const model of models) {
        try {
            console.log(`[Imagen] Trying ${model}...`);
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt.slice(0, 900) }],
                        parameters: { sampleCount: 1 }
                    }),
                    signal: AbortSignal.timeout(35000)
                }
            );

            if (res.ok) {
                const data = await res.json();
                const b64 = data.predictions?.[0]?.bytesBase64Encoded;
                if (b64) {
                    console.log(`[Imagen] ✓ Success via ${model}`);
                    return Buffer.from(b64, "base64");
                }
            } else {
                const txt = await res.text();
                console.warn(`[Imagen] ${model} returned ${res.status}:`, txt.slice(0, 150));
            }
        } catch (err: any) {
            console.warn(`[Imagen] ${model} error:`, err?.message);
        }
    }
    return null;
}

/**
 * Try Hugging Face Inference API – FLUX.1-schnell (free, anonymous, ~4 steps, fast).
 * Falls back to stable-diffusion-xl-base-1.0 if FLUX is cold/loading.
 */
async function tryHuggingFace(prompt: string): Promise<Buffer | null> {
    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN; // optional – works without it too
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    const models = [
        "black-forest-labs/FLUX.1-schnell",
        "stabilityai/stable-diffusion-xl-base-1.0",
    ];

    for (const model of models) {
        try {
            console.log(`[HuggingFace] Trying ${model}...`);
            const res = await fetch(
                `https://api-inference.huggingface.co/models/${model}`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        inputs: prompt.slice(0, 500),
                        parameters: { num_inference_steps: 4 }
                    }),
                    signal: AbortSignal.timeout(45000)
                }
            );

            if (res.ok) {
                const contentType = res.headers.get("content-type") || "";
                // HF returns binary image directly
                if (contentType.includes("image")) {
                    const buf = Buffer.from(await res.arrayBuffer());
                    if (buf.byteLength > 5000) {
                        console.log(`[HuggingFace] ✓ Success via ${model} (${buf.byteLength} bytes)`);
                        return buf;
                    }
                } else {
                    const txt = await res.text();
                    // Model still loading – skip and try next
                    console.warn(`[HuggingFace] ${model} not ready:`, txt.slice(0, 100));
                }
            } else {
                const txt = await res.text();
                console.warn(`[HuggingFace] ${model} returned ${res.status}:`, txt.slice(0, 150));
            }
        } catch (err: any) {
            console.warn(`[HuggingFace] ${model} error:`, err?.message);
        }

        // Small pause before trying next HF model
        await SLEEP(1000);
    }
    return null;
}

/**
 * Try Pollinations.ai (totally free, no API key needed).
 */
async function tryPollinations(prompt: string): Promise<Buffer | null> {
    try {
        console.log("[Pollinations] Trying...");
        const clean = prompt.replace(/[^\w\s,]/g, "").slice(0, 500);
        const seed = Math.floor(Math.random() * 999999);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=1280&height=720&seed=${seed}&nologo=true`;

        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.byteLength > 5000) {
                console.log(`[Pollinations] ✓ Success (${buf.byteLength} bytes)`);
                return buf;
            }
            console.warn("[Pollinations] Buffer too small:", buf.byteLength);
        } else {
            console.warn("[Pollinations] Status:", res.status);
        }
    } catch (err: any) {
        console.warn("[Pollinations] Error:", err?.message);
    }
    return null;
}

/**
 * Main export – tries providers in order:
 * 1. Hugging Face FLUX.1-schnell  (free, no key, most reliable for multiple calls)
 * 2. Gemini Imagen 4              (fast, high quality – but rate-limited on free tier)
 * 3. Pollinations.ai              (free fallback)
 * 4. Solid colour placeholder     (last resort – never blank)
 */
export async function generateImage(prompt: string): Promise<Buffer> {
    // --- 1. Hugging Face (most reliable for burst panel generation) ---
    const hfResult = await tryHuggingFace(prompt);
    if (hfResult) return hfResult;

    // --- 2. Gemini Imagen ---
    const imagenResult = await tryImagen(prompt);
    if (imagenResult) return imagenResult;

    // --- 3. Pollinations ---
    const pollinationsResult = await tryPollinations(prompt);
    if (pollinationsResult) return pollinationsResult;

    // --- 4. Coloured gradient placeholder (never blank) ---
    console.log("[Image] All generators failed – using placeholder");
    const res = await fetch("https://dummyimage.com/1280x720/1e1b4b/7c3aed.png&text=Generating...");
    return Buffer.from(await res.arrayBuffer());
}
