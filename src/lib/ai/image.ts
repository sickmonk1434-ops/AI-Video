export async function generateImage(prompt: string): Promise<Buffer> {
    const API_KEY = process.env.GEMINI_API_KEY;

    // Try Gemini REST API with short timeout
    if (API_KEY) {
        try {
            console.log("Generating Image via Gemini REST API...");
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt.slice(0, 1000) }],
                        parameters: { sampleCount: 1, aspectRatio: "16:9" }
                    }),
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.predictions?.[0]?.bytesBase64Encoded) {
                    return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
                }
            }
        } catch (err: any) {
            console.warn("Gemini Image API failed or timed out, trying Pollinations.ai fallback...", err?.message);
        }
    }

    // Try Pollinations.ai with 12s timeout
    try {
        console.log("Using Pollinations.ai fallback...");
        const cleanPrompt = prompt ? prompt.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 800) : "cinematic view";
        const hasStyle = prompt.toLowerCase().includes("style") || prompt.toLowerCase().includes("art") || prompt.toLowerCase().includes("illustration");
        const enhancedPrompt = hasStyle ? cleanPrompt : `cinematic shot, photorealistic, 4k, ${cleanPrompt}`;
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&model=flux`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(fallbackUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
    } catch (fallbackErr: any) {
        console.warn("Pollinations.ai fallback failed or timed out, returning ultimate placeholder image buffer...", fallbackErr?.message);
    }

    // Ultimate 100% Reliable Fallback: DummyImage Fast CDN Buffer
    console.log("Using Fast CDN DummyImage buffer...");
    const ultimateRes = await fetch("https://dummyimage.com/1280x720/0f172a/38bdf8.png&text=AI+Visual+Scene");
    const ultimateBuffer = await ultimateRes.arrayBuffer();
    return Buffer.from(ultimateBuffer);
}
