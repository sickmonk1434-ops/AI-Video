import { getAllAudioUrls } from 'google-tts-api';

export async function generateVoiceover(text: string): Promise<Buffer> {
  try {
    // Google TTS (Free via Translate API)
    // Note: Quality is "robotic" compared to Edge/ElevenLabs, but it is reliable on servers.
    const results = getAllAudioUrls(text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!', // Split on punctuation
    });

    // Download all segments
    const buffers = await Promise.all(
      results.map(async (item) => {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`Google TTS fetch failed: ${res.statusText}`);
        return res.arrayBuffer();
      })
    );

    // Merge into one buffer
    return Buffer.concat(buffers.map(b => Buffer.from(b)));
  } catch (error) {
    console.error("Google TTS Error:", error);
    throw error;
  }
}
