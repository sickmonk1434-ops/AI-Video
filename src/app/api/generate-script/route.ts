import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { concept } = await req.json();

        if (!concept) {
            return NextResponse.json(
                { error: "Concept is required" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are a professional video scriptwriter. 
      Create a compelling, short video script (approx 30-60 seconds) based on this concept: "${concept}".
      
      Return ONLY valid JSON with this structure:
      {
        "title": "Video Title",
        "description": "Short social media description",
        "scenes": [
          {
            "segment_id": 1,
            "visual_description": "Detailed image generation prompt for Stable Diffusion (photorealistic, 8k, etc). Describe the subject, lighting, style.",
            "voiceover": "The exact spoken words for this scene."
          }
        ]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();

        try {
            const script = JSON.parse(text);
            return NextResponse.json({ script });
        } catch (e) {
            console.error("JSON Parse Error:", text);
            return NextResponse.json({ error: "Failed to parse script", raw: text }, { status: 500 });
        }

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
