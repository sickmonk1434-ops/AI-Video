import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from './cloudinary';
import { db } from './db';

// Configure FFmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

interface Scene {
    imageUrl: string;
    audioUrl: string;
    duration: number; // in seconds
}

export async function assembleVideo(renderId: string, scenes: Scene[]): Promise<string> {
    return new Promise((resolve, reject) => {
        // Ensure output directory exists (public/videos)
        const outputDir = path.join(process.cwd(), 'public', 'videos');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, `${renderId}.mp4`);
        const command = ffmpeg();

        // ---------------------------------------------------------
        // Construct Inputs & Complex Filter
        // ---------------------------------------------------------

        const complexFilter: string[] = [];
        const videoStreams: string[] = [];
        const audioStreams: string[] = [];

        scenes.forEach((scene, index) => {
            // Inputs:
            // Input 2*index = Image
            // Input 2*index+1 = Audio
            command.input(scene.imageUrl).inputOptions([`-loop 1`, `-t ${scene.duration}`]);
            command.input(scene.audioUrl);

            // Filter for this scene's video:
            const vLabel = `v${index}`;
            // Simple scaling
            complexFilter.push(
                `[${index * 2}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[${vLabel}]`
            );

            videoStreams.push(`[${vLabel}]`);
            audioStreams.push(`[${index * 2 + 1}:a]`);
        });

        // Concat Filter
        const concatFilter = `${videoStreams.join('')}${audioStreams.join('')}concat=n=${scenes.length}:v=1:a=1[outv][outa]`;
        complexFilter.push(concatFilter);

        command
            .complexFilter(complexFilter)
            .outputOptions([
                '-map [outv]',
                '-map [outa]',
                '-c:v libx264',
                '-preset ultrafast', // Use max CPU speed
                '-threads 0',        // Use all available CPU cores
                '-pix_fmt yuv420p',
                '-c:a aac',
                '-shortest'
            ])
            .output(outputPath)
            .on('start', (cmdLine) => {
                console.log('FFmpeg process started:', cmdLine);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('FFmpeg Error:', err.message);
                console.error('FFmpeg Stderr:', stderr);
                reject(err);
            })
            .on('end', async () => {
                console.log('FFmpeg processing finished:', outputPath);

                try {
                    // Upload to Cloudinary
                    console.log('Uploading to Cloudinary...');

                    // Read file buffer
                    const fileBuffer = fs.readFileSync(outputPath);
                    const cloudinaryUrl = await uploadToCloudinary(fileBuffer, "video-ai-renders", "video");

                    console.log('Cloudinary URL:', cloudinaryUrl);

                    // Update DB
                    await db.execute({
                        sql: "UPDATE projects SET status = ?, video_url = ? WHERE id = ?",
                        args: ["done", cloudinaryUrl, renderId]
                    });

                    // Optional: Cleanup local file
                    // fs.unlinkSync(outputPath);

                    resolve(cloudinaryUrl);
                } catch (uploadErr: any) {
                    console.error("Upload/DB Error:", uploadErr);
                    try {
                        await db.execute({
                            sql: "UPDATE projects SET status = ? WHERE id = ?",
                            args: ["failed", renderId]
                        });
                    } catch (dbErr) { console.error("Failed to update DB error status", dbErr) }

                    // Fallback: Resolve with local path if upload fails
                    resolve(`/videos/${renderId}.mp4`);
                }
            })
            .run();
    });
}
