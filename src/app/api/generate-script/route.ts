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

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
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
