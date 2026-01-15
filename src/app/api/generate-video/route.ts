import { NextResponse } from "next/server";
import { generateVoiceover } from "@/lib/ai/voice";
import { generateImage } from "@/lib/ai/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db, initDB } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        await initDB();
        const { title, scenes } = await req.json();

        if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
            return NextResponse.json({ error: "Invalid scenes data" }, { status: 400 });
        }

        // Limit to 3 scenes for now to prevent timeouts in this demo
        // const scenesToProcess = scenes.slice(0, 3);
        const scenesToProcess = scenes;

        // 1. Generate Assets for all scenes (SEQUENTIAL to avoid Rate Limits)
        const assets = [];
        for (const scene of scenesToProcess) {
            // Generate Voice and Image for this scene
            // We can do voice and image in parallel for a SINGLE scene (2 requests), 
            // but we shouldn't do multiple scenes at once.
            const [audioBuffer, imageBuffer] = await Promise.all([
                generateVoiceover(scene.voiceover),
                generateImage(scene.visual_description),
            ]);

            // Upload to Cloudinary
            const [audioUrl, imageUrl] = await Promise.all([
                uploadToCloudinary(audioBuffer, "video-ai/audio", "video"),
                uploadToCloudinary(imageBuffer, "video-ai/images", "image")
            ]);

            assets.push({
                ...scene,
                audioUrl,
                imageUrl,
            });
        }

        // 2. Prepare for Local FFmpeg
        const SCENE_DURATION = 8;
        const ffmpegScenes = assets.map(asset => ({
            imageUrl: asset.imageUrl,
            audioUrl: asset.audioUrl,
            duration: SCENE_DURATION
        }));

        // 3. Save to DB & Trigger Rendering
        const projectId = uuidv4(); // This will serve as our renderId

        try {
            await db.execute({
                sql: "INSERT INTO projects (id, concept, script, status, created_at) VALUES (?, ?, ?, ?, ?)",
                args: [projectId, title || "Untitled", JSON.stringify(scenes), "processing", Math.floor(Date.now() / 1000)]
            });
        } catch (e) {
            console.error("DB Save Error:", e);
        }

        // 4. Trigger local FFmpeg (Async - Fire and forget)
        const { assembleVideo } = await import("@/lib/video-generator");

        console.log(`Starting local FFmpeg render: ${projectId}`);
        assembleVideo(projectId, ffmpegScenes)
            .then((outputPath) => {
                console.log(`Render complete for ${projectId}: ${outputPath}`);
            })
            .catch((err) => {
                console.error(`Render failed for ${projectId}:`, err);
            });

        return NextResponse.json({
            success: true,
            renderId: projectId,
            projectId,
            message: "Video rendering started locally"
        });

    } catch (error: any) {
        console.error("Generate Video Error Detailed:", error);
        console.error("Stack:", error.stack);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
