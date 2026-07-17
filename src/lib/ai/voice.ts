import { tts } from 'edge-tts';
import { getAllAudioUrls } from 'google-tts-api';

export async function generateVoiceover(text: string): Promise<Buffer> {
  const cleanText = text ? text.replace(/<[^>]*>/g, "").trim() : "Audio segment";

  try {
    console.log("Generating Voiceover via Edge TTS...");
    const buffer = await tts(cleanText || "Audio segment", {
      voice: "en-US-ChristopherNeural",
    });
    return Buffer.from(buffer);
  } catch (err: any) {
    console.warn("Edge TTS failed, falling back to Google TTS...", err?.message);
    try {
      const results = getAllAudioUrls(cleanText || "Audio segment", {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        splitPunct: ',.?!',
      });

      const buffers = await Promise.all(
        results.map(async (item) => {
          const res = await fetch(item.url);
          if (!res.ok) throw new Error(`Google TTS fetch failed`);
          return res.arrayBuffer();
        })
      );

      return Buffer.concat(buffers.map(b => Buffer.from(b)));
    } catch (fallbackErr) {
      console.error("All TTS generators failed:", fallbackErr);
      throw fallbackErr;
    }
  }
}
