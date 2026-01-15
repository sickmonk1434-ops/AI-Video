import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateImage(prompt: string): Promise<Buffer> {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.warn("Missing Gemini API Key for Image Gen. Falling back.");
        return fallbackImage(prompt);
    }

    try {
        // Use the new simplified generic client or the specialized one if preferred.
        // For Imagen 3, we often use the standard generative model interface if available,
        // or the specific image model.
        // Note: The @google/genai SDK might have specific image methods differently than text.
        // Assuming standard interface for now or using the REST pattern if SDK differs slightly.

        // REVISION: For Imagen 3 specifically, it's often safer to use the REST API directly 
        // until the SDK types are fully stabilized for image bytes in all environments.

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "16:9"
                    }
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini Image API Error: ${err}`);
        }

        const data = await response.json();

        // Imagen 3 response structure: { predictions: [ { bytesBase64Encoded: "..." } ] }
        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            const base64 = data.predictions[0].bytesBase64Encoded;
            return Buffer.from(base64, 'base64');
        } else {
            throw new Error("Invalid Imagen 3 response structure");
        }

    } catch (error) {
        console.error("Gemini Image Gen Failed:", error);
        return fallbackImage(prompt);
    }
}

async function fallbackImage(prompt: string): Promise<Buffer> {
    console.log("Using Pollinations.ai fallback...");
    const enhancedPrompt = `cinematic shot, photorealistic, 4k, hyper detailed, ${prompt}`;
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&model=flux`;

    const res = await fetch(fallbackUrl);
    if (!res.ok) throw new Error("Fallback image generation failed.");
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
