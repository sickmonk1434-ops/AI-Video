
export async function generateImage(prompt: string): Promise<ArrayBuffer> {
    const API_KEY = process.env.HUGGINGFACE_API_KEY;
    const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";

    if (!API_KEY) throw new Error("Missing Hugging Face API Key");

    const response = await fetch(
        `https://api-inference.huggingface.co/models/${MODEL_ID}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API Error: ${errorText}`);
    }

    return response.arrayBuffer();
}
