import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Fallback chain: try each model in order until one succeeds
const GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
];

export async function POST(req: Request) {
    try {
        const { concept } = await req.json();

        if (!concept) {
            return NextResponse.json({ error: "Concept is required" }, { status: 400 });
        }

        const promptText = `
      You are a professional video scriptwriter. 
      Create a compelling video script (approx 60-90 seconds) based on this concept: "${concept}".
      The script must have at least 5-7 distinct scenes.
      
      Return ONLY valid JSON with this structure:
      {
        "title": "Video Title",
        "description": "Short social media description",
        "scenes": [
          {
            "segment_id": 1,
            "visual_description": "A highly detailed, cinematic, photorealistic image description using visual keywords (e.g., '4k', 'dramatic lighting', 'sharp focus', 'mid-shot'). Describe the subject, action, lighting, and mood precisely. Avoid text references.",
            "voiceover": "The exact spoken words for this scene."
          }
        ]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON.
    `;

        let script: any = null;
        let lastError: any = null;

        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`[generate-script] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(promptText);
                const text = result.response.text().replace(/```json|```/g, "").trim();
                script = JSON.parse(text);
                console.log(`[generate-script] ✓ Success with ${modelName}`);
                break;
            } catch (err: any) {
                lastError = err;
                console.warn(`[generate-script] ${modelName} failed:`, err?.message?.slice(0, 120));
            }
        }

        if (!script) {
            return NextResponse.json(
                { error: lastError?.message || "All Gemini models failed to generate script" },
                { status: 500 }
            );
        }

        return NextResponse.json({ script });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
