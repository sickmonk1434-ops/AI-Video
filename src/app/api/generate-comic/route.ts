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
        const { prompt: conceptPrompt, panelCount, style } = await req.json();

        if (!conceptPrompt) {
            return NextResponse.json({ error: "Comic prompt description is required" }, { status: 400 });
        }

        const count = panelCount ? parseInt(panelCount) : 4;
        const styleName = style || "Comic Book Art";

        // Try each model until one succeeds (avoids quota exhaustion on a single model)
        let comicScript: any = null;
        let lastError: any = null;

        for (const modelName of GEMINI_MODELS) {

        const promptText = `
      You are a professional comic strip writer and illustrator.
      Create a detailed panel-by-panel script for a comic strip (exactly ${count} panels) based on this concept: "${conceptPrompt}".
      
      Return ONLY valid JSON with this structure:
      {
        "title": "Comic Title",
        "description": "Short social media description of the comic strip",
        "style_directives": "Visual instructions to keep the main character's design consistent across all panels (e.g., 'The main character is a chubby ginger cat wearing blue space goggles'). Describe character clothes, colors, and key details.",
        "panels": [
          {
            "panel_id": 1,
            "visual_description": "Detailed image generation description of the scene in this specific panel. Include action, background environment, lighting, and camera angle. Mention key characters based on style_directives. Keep it descriptions-only, do not include text/dialogue in the visual prompt.",
            "dialogue": "Exact dialogue or narrator caption text for this panel.",
            "speaker": "Speaker Name (e.g., 'Ginger Cat', or 'Narrator')"
          }
        ]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON.
    `;

            try {
                console.log(`[generate-comic] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(promptText);
                const text = result.response.text().replace(/```json|```/g, "").trim();
                comicScript = JSON.parse(text);
                console.log(`[generate-comic] ✓ Success with ${modelName}`);
                break; // success — stop trying
            } catch (err: any) {
                lastError = err;
                console.warn(`[generate-comic] ${modelName} failed:`, err?.message?.slice(0, 120));
            }
        }

        if (!comicScript) {
            return NextResponse.json({ error: lastError?.message || "All Gemini models failed" }, { status: 500 });
        }

        // Return script WITHOUT images — the client will call /api/generate-panel-image for each panel
        return NextResponse.json({
            success: true,
            title: comicScript.title,
            description: comicScript.description,
            style: styleName,
            styleDirectives: comicScript.style_directives,
            panels: comicScript.panels.map((p: any) => ({
                panel_id: p.panel_id,
                visual_description: p.visual_description,
                dialogue: p.dialogue,
                speaker: p.speaker,
                imageUrl: "", // filled in by client
            })),
        });

    } catch (error: any) {
        console.error("Generate Comic API Error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
