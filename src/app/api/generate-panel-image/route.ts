import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/image";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const maxDuration = 60; // allow up to 60s per single image on Vercel

export async function POST(req: Request) {
    try {
        const { prompt, panelId } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        console.log(`[generate-panel-image] Panel ${panelId}: ${prompt.slice(0, 80)}...`);

        const imageBuffer = await generateImage(prompt);
        const imageUrl = await uploadToCloudinary(imageBuffer, "comics", "image");

        console.log(`[generate-panel-image] Panel ${panelId} ✓ → ${imageUrl.slice(0, 60)}`);
        return NextResponse.json({ success: true, imageUrl });

    } catch (error: any) {
        console.error("[generate-panel-image] Error:", error);
        return NextResponse.json({ error: error?.message || "Image generation failed" }, { status: 500 });
    }
}
