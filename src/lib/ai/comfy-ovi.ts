import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import workflowTemplate from './ovi-workflow-api.json';

const COMFYUI_URL = process.env.COMFYUI_SERVER_URL || 'http://127.0.0.1:8188';

interface OviOptions {
    voiceSource: 'ovi' | 'external';
    prompt: string;
    bgMusic?: string; // New
    imageBuffer?: Buffer;
    audioBuffer?: Buffer;
}

export async function generateComfyOviVideo(options: OviOptions): Promise<string> {
    const clientId = uuidv4();
    const serverAddr = COMFYUI_URL.replace('http://', '');

    console.log(`Sending job to ComfyUI at ${COMFYUI_URL}...`);

    // 1. Prepare the workflow
    const workflow = JSON.parse(JSON.stringify(workflowTemplate));

    // Set prompt
    let finalPrompt = options.prompt;
    if (options.voiceSource === 'ovi') {
        // Wrap in speech tags if not already present
        if (!finalPrompt.includes('<S>')) {
            finalPrompt = `<S>${finalPrompt}</S>`;
        }
    }

    // Add Background Music description if provided
    if (options.bgMusic) {
        finalPrompt += ` <AUDCAP>${options.bgMusic}</AUDCAP>`;
    }

    workflow["6"].inputs.prompt = finalPrompt;

    // Handle Input Image (Upload to ComfyUI)
    if (options.imageBuffer) {
        const imageName = await uploadBufferToComfyUI(options.imageBuffer, 'input_image.png');
        workflow["10"].inputs.image = imageName;
        workflow["6"].class_type = "RunningHub Ovi Image to Video";
    } else {
        // Fallback to Text to Video if no image provided
        workflow["6"].class_type = "RunningHub Ovi Text to Video";
        delete workflow["6"].inputs.image;
        delete workflow["10"]; // Remove LoadImage node
    }

    // Handle External Audio (Optional: If workflow supports it)
    // Note: To support external audio, the workflow JSON would need a 'Load Audio' node
    // For now, we are focusing on Ovi's native audio as requested for the 'simple' version.
    // However, if voiceSource is 'external', we could potentially mix it later or use a different template.

    // 2. Queue the job
    const response = await fetch(`${COMFYUI_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow, client_id: clientId })
    });

    if (!response.ok) {
        throw new Error(`ComfyUI Prompt Error: ${await response.text()}`);
    }

    const { prompt_id } = await response.json();
    console.log(`Prompt queued with ID: ${prompt_id}`);

    // 3. Wait for completion via WebSocket
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${serverAddr}/ws?clientId=${clientId}`);

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === prompt_id) {
                // Done!
                ws.close();
                getHistory(prompt_id).then(resolve).catch(reject);
            }
        });

        ws.on('error', (err) => {
            ws.close();
            reject(err);
        });

        // Timeout fallback
        setTimeout(() => {
            ws.close();
            reject(new Error("ComfyUI generation timed out (90s)"));
        }, 90000);
    });
}

async function uploadBufferToComfyUI(buffer: Buffer, fileName: string): Promise<string> {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);
    formData.append('image', blob, fileName);
    formData.append('type', 'input');
    formData.append('overwrite', 'true');

    const res = await fetch(`${COMFYUI_URL}/upload/image`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) throw new Error(`Upload to ComfyUI failed: ${await res.text()}`);
    const data = await res.json();
    return data.name;
}

async function getHistory(promptId: string): Promise<string> {
    const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await res.json();

    const output = history[promptId].outputs["12"]; // Node 12 is SaveVideo
    if (!output || !output.gifs || output.gifs.length === 0) {
        throw new Error("No video output found in history");
    }

    const filename = output.gifs[0].filename;

    // Download final video from ComfyUI
    const videoRes = await fetch(`${COMFYUI_URL}/view?filename=${filename}&type=output`);
    const buffer = await videoRes.arrayBuffer();

    // Save to local public/videos
    const localPath = path.join(process.cwd(), 'public', 'videos', `ovi_${uuidv4()}.mp4`);
    fs.writeFileSync(localPath, Buffer.from(buffer));

    return `/videos/${path.basename(localPath)}`;
}
