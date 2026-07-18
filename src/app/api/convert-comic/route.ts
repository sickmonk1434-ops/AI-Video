import { NextResponse } from "next/server";
import { generateVoiceover } from "@/lib/ai/voice";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db, initDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
    try {
        await initDB();
        const { title, panels, aspectRatio } = await req.json();

        if (!panels || !Array.isArray(panels) || panels.length === 0) {
            return NextResponse.json({ error: "Invalid panels data" }, { status: 400 });
        }

        const isOffline = process.env.OFFLINE_MODE === "true";
        const projectId = uuidv4();

        // 1. Determine Dimensions
        // 9:16 vertical (720x1280) or 16:9 landscape (1280x720)
        const isVertical = aspectRatio === "9:16";
        const width = isVertical ? 720 : 1280;
        const height = isVertical ? 1280 : 720;

        // Ensure directories exist locally if offline
        if (isOffline) {
            const localComicsDir = path.join(process.cwd(), "public", "comics");
            const localAudioDir = path.join(process.cwd(), "public", "audio");
            if (!fs.existsSync(localComicsDir)) fs.mkdirSync(localComicsDir, { recursive: true });
            if (!fs.existsSync(localAudioDir)) fs.mkdirSync(localAudioDir, { recursive: true });
        }

        const ffmpegScenes = [];

        // 2. Process each panel (image + voiceover tts)
        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            let imageUrl = "";

            // Handle base64 canvas image data URL
            if (panel.imageUrl.startsWith("data:image")) {
                const base64Data = panel.imageUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");

                if (isOffline) {
                    const fileName = `canvas_${projectId}_panel_${panel.panel_id}.png`;
                    const filePath = path.join(process.cwd(), "public", "comics", fileName);
                    fs.writeFileSync(filePath, buffer);
                    imageUrl = `/comics/${fileName}`;
                } else {
                    imageUrl = await uploadToCloudinary(buffer, "comics", "image");
                }
            } else {
                imageUrl = panel.imageUrl;
            }

            // Generate Voiceover
            const voiceText = panel.dialogue || "Next scene";
            const audioBuffer = await generateVoiceover(voiceText);
            let audioUrl = "";

            if (isOffline) {
                const audioName = `audio_${projectId}_panel_${panel.panel_id}.mp3`;
                const audioPath = path.join(process.cwd(), "public", "audio", audioName);
                fs.writeFileSync(audioPath, audioBuffer);
                audioUrl = `/audio/${audioName}`;
            } else {
                audioUrl = await uploadToCloudinary(audioBuffer, "comics/audio", "video");
            }

            // Calculate duration: word count / 2.0 words-per-second, minimum of 4 seconds
            const wordCount = voiceText.split(" ").length;
            const duration = Math.max(4, Math.ceil(wordCount / 2.0) + 1);

            ffmpegScenes.push({
                imageUrl,
                audioUrl,
                duration,
            });
        }

        // 3. Save to DB
        try {
            await db.execute({
                sql: "INSERT INTO projects (id, concept, script, status, created_at) VALUES (?, ?, ?, ?, ?)",
                args: [projectId, title || "Untitled Comic", JSON.stringify(panels), "processing", Math.floor(Date.now() / 1000)]
            });
        } catch (e) {
            console.error("DB Save Error in Comic Converter:", e);
        }

        // 4. Trigger video assembler asynchronously (fire and forget)
        const { assembleVideo } = await import("@/lib/video-generator");

        console.log(`Starting comic slideshow render for ${projectId} (${width}x${height})`);
        assembleVideo(projectId, ffmpegScenes, width, height)
            .then((outputPath) => {
                console.log(`Render complete for comic ${projectId}: ${outputPath}`);
            })
            .catch((err) => {
                console.error(`Render failed for comic ${projectId}:`, err);
            });

        return NextResponse.json({
            success: true,
            renderId: projectId,
            projectId,
            message: "Comic slideshow compilation started"
        });

    } catch (error: any) {
        console.error("Convert Comic to Video Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
