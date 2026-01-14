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

        // 1. Generate Assets for all scenes
        const assets = await Promise.all(
            scenesToProcess.map(async (scene: any) => {
                // Run Voice and Image gen in parallel for this scene
                const [audioBuffer, imageBuffer] = await Promise.all([
                    generateVoiceover(scene.voiceover),
                    generateImage(scene.visual_description),
                ]);

                // Upload to Cloudinary
                const [audioUrl, imageUrl] = await Promise.all([
                    uploadToCloudinary(audioBuffer, "video-ai/audio", "video"), // Cloudinary handles audio as 'video' resource type sometimes, or 'raw'
                    uploadToCloudinary(imageBuffer, "video-ai/images", "image")
                ]);

                return {
                    ...scene,
                    audioUrl,
                    imageUrl,
                };
            })
        );

        // 2. Build Shotstack Timeline JSON


        // REVISED SHOTSTACK LOGIC:
        // We really need asset durations. Since we can't easily probe audio on the server without `ffprobe` (heavy),
        // We will estimate or just put them in a sequence on a single track if allowed, 
        // OR we just make a simple slideshow: 5 seconds per image.

        // Let's create a simpler timeline: One track with Images (5s each). One track with Audio (offset by 5s each).
        const SCENE_DURATION = 6;

        const imageClips = assets.map((asset: any, i: number) => ({
            asset: {
                type: "image",
                src: asset.imageUrl,
            },
            start: i * SCENE_DURATION,
            length: SCENE_DURATION,
            fit: "crop",
            scale: 1,
            effect: "zoomIn",
            transition: { in: "fade", out: "fade" }
        }));

        const audioClips = assets.map((asset: any, i: number) => ({
            asset: {
                type: "audio",
                src: asset.audioUrl,
            },
            start: i * SCENE_DURATION,
            // length: // let it play out, hopefully it's shorter than 5s
        }));

        const timeline = {
            tracks: [
                { clips: imageClips }, // Top layer (Visuals)
                { clips: audioClips }  // Bottom layer (Audio)
            ]
        };

        const output = {
            format: "mp4",
            resolution: "sd" // 720p is safer for free tier
        };

        const shotstackPayload = {
            timeline,
            output
        };

        // 3. Send to Shotstack
        const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
        const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || "sandbox";
        const SHOTSTACK_URL = `https://api.shotstack.io/${SHOTSTACK_ENV}/render`;

        const shotstackRes = await fetch(SHOTSTACK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": SHOTSTACK_API_KEY || ""
            },
            body: JSON.stringify(shotstackPayload)
        });

        const shotstackData = await shotstackRes.json();

        if (!shotstackRes.ok) {
            console.error("Shotstack Error:", shotstackData);
            throw new Error(shotstackData.message || "Failed to trigger render");
        }

        // 4. Save to DB
        const projectId = uuidv4();
        try {
            await db.execute({
                sql: "INSERT INTO projects (id, concept, script, status, created_at) VALUES (?, ?, ?, ?, ?)",
                args: [projectId, title || "Untitled", JSON.stringify(scenes), "processing", Math.floor(Date.now() / 1000)]
            });
        } catch (e) {
            console.error("DB Save Error:", e);
            // Don't fail the request if DB fails, return the render ID
        }

        return NextResponse.json({
            success: true,
            renderId: shotstackData.response.id,
            projectId,
            message: "Video rendering started"
        });

    } catch (error: any) {
        console.error("Generate Video Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
