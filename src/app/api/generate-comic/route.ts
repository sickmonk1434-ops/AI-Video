import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { prompt: conceptPrompt, panelCount, style } = await req.json();

        if (!conceptPrompt) {
            return NextResponse.json(
                { error: "Comic prompt description is required" },
                { status: 400 }
            );
        }

        const count = panelCount ? parseInt(panelCount) : 4;
        const styleName = style || "Comic Book Art";

        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

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

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();

        let comicScript;
        try {
            comicScript = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            return NextResponse.json({ error: "Failed to parse comic script from Gemini", raw: text }, { status: 500 });
        }

        // 2. Generate illustrations for each panel in parallel
        const isOffline = process.env.OFFLINE_MODE === "true";
        const comicId = uuidv4();

        // Ensure local output folder exists if offline
        if (isOffline) {
            const localComicsDir = path.join(process.cwd(), "public", "comics");
            if (!fs.existsSync(localComicsDir)) {
                fs.mkdirSync(localComicsDir, { recursive: true });
            }
        }

        const panelPromises = comicScript.panels.map(async (panel: any, index: number) => {
            // Stagger the starts of each panel generation by 1.5s
            // This prevents hitting strict concurrent rate limits on Gemini and protects Pollinations from concurrent bursts.
            await new Promise(resolve => setTimeout(resolve, index * 1500));

            const stylePrompt = `${styleName} style illustration, vibrant coloring, clear comic panel art, ${comicScript.style_directives}. Scene: ${panel.visual_description}`;

            console.log(`Generating image for panel ${panel.panel_id} (Staggered delay: ${index * 1.5}s): ${stylePrompt.slice(0, 80)}...`);

            const imageBuffer = await generateImage(stylePrompt);

            let imageUrl = "";
            if (isOffline) {
                const fileName = `comic_${comicId}_panel_${panel.panel_id}.png`;
                const filePath = path.join(process.cwd(), "public", "comics", fileName);
                fs.writeFileSync(filePath, imageBuffer);
                imageUrl = `/comics/${fileName}`;
            } else {
                imageUrl = await uploadToCloudinary(imageBuffer, "comics", "image");
            }

            return {
                ...panel,
                imageUrl,
            };
        });

        const outputPanels = await Promise.all(panelPromises);

        return NextResponse.json({
            success: true,
            comicId,
            title: comicScript.title,
            description: comicScript.description,
            style: styleName,
            panels: outputPanels,
        });

    } catch (error: any) {
        console.error("Generate Comic API Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
