
export async function generateVoiceover(text: string): Promise<ArrayBuffer> {
    const API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - Default pre-made voice

    if (!API_KEY) throw new Error("Missing ElevenLabs API Key");

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": API_KEY,
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API Error: ${errorText}`);
    }

    return response.arrayBuffer();
}
