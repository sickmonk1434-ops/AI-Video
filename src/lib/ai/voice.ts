// @ts-ignore
import { MsEdgeTTS, OUTPUT_FORMAT } from "ms-edge-tts";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";

export async function generateVoiceover(text: string): Promise<Buffer> {
  const tempFile = path.join(os.tmpdir(), `${uuidv4()}.mp3`);
  const tts = new MsEdgeTTS();

  // Using Christopher (Male) or Aria (Female) - "ChristopherNeural" is great for narration
  await tts.setMetadata("en-US-ChristopherNeural", OUTPUT_FORMAT.MP3_128K);

  try {
    await tts.toFile(tempFile, text);
    const buffer = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return buffer;
  } catch (error) {
    // Cleanup if error occurs after file creation
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    throw error;
  }
}
