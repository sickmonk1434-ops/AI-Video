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

    // Try Pollinations.ai with retries and backoff
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Using Pollinations.ai fallback (Attempt ${attempt}/${maxRetries})...`);
            const cleanPrompt = prompt ? prompt.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 800) : "cinematic view";
            const hasStyle = prompt.toLowerCase().includes("style") || prompt.toLowerCase().includes("art") || prompt.toLowerCase().includes("illustration");
            const enhancedPrompt = hasStyle ? cleanPrompt : `cinematic shot, photorealistic, 4k, ${cleanPrompt}`;
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&nologo=true`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s per attempt

            const res = await fetch(fallbackUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                // Check if buffer contains actual image data (not empty/corrupt)
                if (arrayBuffer.byteLength > 1000) {
                    return Buffer.from(arrayBuffer);
                }
            }
            console.warn(`Pollinations.ai attempt ${attempt} returned status ${res.status} or empty buffer.`);
        } catch (fallbackErr: any) {
            console.warn(`Pollinations.ai attempt ${attempt} failed or timed out:`, fallbackErr?.message);
        }

        // Delay before next retry (1s, 2s)
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }

    // Ultimate 100% Reliable Fallback: DummyImage Fast CDN Buffer
    console.log("Using Fast CDN DummyImage buffer...");
    const ultimateRes = await fetch("https://dummyimage.com/1280x720/0f172a/38bdf8.png&text=AI+Visual+Scene");
    const ultimateBuffer = await ultimateRes.arrayBuffer();
    return Buffer.from(ultimateBuffer);
}
