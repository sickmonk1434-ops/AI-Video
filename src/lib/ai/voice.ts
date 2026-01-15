// @ts-ignore
import { tts } from "edge-tts";

export async function generateVoiceover(text: string): Promise<Buffer> {
  try {
    // Using Christopher (Male) - "ChristopherNeural" is great for narration
    const buffer = await tts(text, {
      voice: "en-US-ChristopherNeural"
    });
    return buffer;
  } catch (error) {
    console.error("Edge TTS Error:", error);
    throw error;
  }
}
