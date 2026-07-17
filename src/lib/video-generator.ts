import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from './cloudinary';
import { db } from './db';

// Configure FFmpeg path
// Prioritize system FFmpeg (critical for Alpine Linux / Docker)
const systemFfmpeg = '/usr/bin/ffmpeg';
const localWinFfmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

if (fs.existsSync(systemFfmpeg)) {
    console.log('Using System FFmpeg at', systemFfmpeg);
    ffmpeg.setFfmpegPath(systemFfmpeg);
} else if (fs.existsSync(localWinFfmpeg)) {
    console.log('Using absolute Windows local ffmpeg-static at', localWinFfmpeg);
    ffmpeg.setFfmpegPath(localWinFfmpeg);
} else if (ffmpegPath) {
    let cleanPath = ffmpegPath;
    if (cleanPath.startsWith('\\ROOT\\')) {
        cleanPath = cleanPath.replace(/^\\ROOT\\[^\\]+/, process.cwd());
    }
    console.log('Using cleaned ffmpeg-static path at', cleanPath);
    ffmpeg.setFfmpegPath(cleanPath);
}


interface Scene {
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string; // New: Pre-rendered video clip
    duration: number; // in seconds
}

// Helper: Process a single scene into a video segment
// running in parallel maximizes CPU usage
async function renderScene(scene: Scene, index: number, renderId: string, outputDir: string): Promise<string> {
    const segmentPath = path.join(outputDir, `${renderId}_seg_${index}.mp4`);

    // If we already have a video clip, just copy/transcode it to the segment path
    if (scene.videoUrl) {
        return new Promise((resolve, reject) => {
            // videoUrl is relative to public folder (e.g. /videos/...)
            const inputPath = path.join(process.cwd(), 'public', scene.videoUrl!);

            ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset ultrafast',
                    '-pix_fmt yuv420p',
                    '-c:a aac',
                    '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1'
                ])
                .output(segmentPath)
                .on('error', (err) => reject(new Error(`Scene ${index} (video) failed: ${err.message}`)))
                .on('end', () => resolve(segmentPath))
                .run();
        });
    }

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(scene.imageUrl!)
            .inputOptions(['-loop 1', `-t ${scene.duration}`])
            .input(scene.audioUrl!)
            .complexFilter([
                `[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v]`,
                // Ensure audio matches video duration exactly to prevent sync drift
                `[1:a]apad[a]`
            ])
            .outputOptions([
                '-map [v]',
                '-map [a]',
                '-c:v libx264',
                '-preset ultrafast', // Fastest encoding
                '-tune zerolatency',
                '-crf 28',
                '-pix_fmt yuv420p',
                '-c:a aac',
                '-shortest' // Cut at shortest input (video length controlled by -t)
            ])
            .output(segmentPath)
            .on('error', (err) => reject(new Error(`Scene ${index} failed: ${err.message}`)))
            .on('end', () => resolve(segmentPath))
            .run();
    });
}

export async function assembleVideo(renderId: string, scenes: Scene[]): Promise<string> {
    const outputDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const finalPath = path.join(outputDir, `${renderId}.mp4`);
    const listPath = path.join(outputDir, `${renderId}_list.txt`);
    let segmentPaths: string[] = [];

    try {
        console.log(`Starting parallel render for ${renderId} with ${scenes.length} scenes...`);

        // 1. Render all scenes in parallel
        segmentPaths = await Promise.all(
            scenes.map((scene, idx) => renderScene(scene, idx, renderId, outputDir))
        );

        console.log(`All segments rendered. Stitching...`);

        // 2. Create Concat List
        // Format: file '/absolute/path/to/file'
        const fileContent = segmentPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(listPath, fileContent);

        // 3. Stitch using concat demuxer (Instant, no re-encoding)
        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions(['-c copy']) // Direct stream copy
                .output(finalPath)
                .on('error', (err) => reject(new Error(`Stitching failed: ${err.message}`)))
                .on('end', () => resolve())
                .run();
        });

        console.log('Video generated successfully:', finalPath);

        // 4. Upload & Update DB
        const fileBuffer = fs.readFileSync(finalPath);
        const cloudinaryUrl = await uploadToCloudinary(fileBuffer, "video-ai-renders", "video");

        await db.execute({
            sql: "UPDATE projects SET status = ?, video_url = ? WHERE id = ?",
            args: ["done", cloudinaryUrl, renderId]
        });

        return cloudinaryUrl;

    } catch (error: unknown) {
        console.error("Generate Video Error Detailed:", error);

        await db.execute({
            sql: "UPDATE projects SET status = ? WHERE id = ?",
            args: ["failed", renderId]
        });

        throw error;
    } finally {
        // Cleanup temp files
        if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
        segmentPaths.forEach(p => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
        // Note: We keep the final video locally in public/videos for fallback/cache
        // or you can delete it: if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }
}
