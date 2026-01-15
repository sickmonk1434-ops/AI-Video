// @ts-ignore
import { EdgeTTS } from "edge-tts";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";

export async function generateVoiceover(text: string): Promise<Buffer> {
  const tempFile = path.join(os.tmpdir(), `${uuidv4()}.mp3`);

  // Instantiate. Note: Arguments might vary.
  // Common: new EdgeTTS({ voice: ... })
  // Let's try standard instantiation.
  const tts = new EdgeTTS({
    voice: "en-US-ChristopherNeural"
  });

  try {
    await tts.ttsPromise(text, tempFile);
    const buffer = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return buffer;
  } catch (error) {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    throw error;
  }
}
