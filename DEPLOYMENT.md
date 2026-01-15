
# Deploying to Render.com

This project is configured to use **Docker**, which makes deploying to Render very straightforward.

## Prerequisites

1. **GitHub Repository**: Push this code to a GitHub repository (private or public).
2. **API Keys**: Have your `GEMINI_API_KEY` and `ELEVENLABS_API_KEY` ready.
3. **Render Account**: Create an account at [render.com](https://render.com/).

## Step-by-Step Instructions

1. **New Web Service**
    * Click the **"New +"** button in the Render dashboard.
    * Select **"Web Service"**.

2. **Connect Repository**
    * Connect your GitHub account.
    * Select the repository containing this project.

3. **Configuration**
    * **Name**: Give your service a name (e.g., `ai-video-creator`).
    * **Runtime**: Select **Docker** (This is crucial!).
    * **Region**: Choose the one closest to you (e.g., `Singapore`, `Frankfurt`, `Oregon`).
    * **Instance Type**: **Free** is fine for testing, but upgrading to a paid tier (Starter) is recommended for better CPU performance during video rendering.

4. **Environment Variables**
    * Scroll down to the **"Environment Variables"** section.
    * Add the following keys:
        * `GEMINI_API_KEY`: (Paste your Google Gemini API key)
        * `ELEVENLABS_API_KEY`: (Paste your ElevenLabs API key)
        * `NEXT_PUBLIC_APP_URL`: (Set this to your Render URL after creation, or just use `/` for relative paths)

5. **Deploy**
    * Click **"Create Web Service"**.

## Notes on Persistent Storage

* **Temporary Files**: On the Free/Starter tiers, the generated video files in `/public/videos` are **ephemeral**. This means if the server restarts (which happens frequently on Free tier), the videos will be deleted.
* **Permanent Storage**: To keep videos forever, you should either:
    1. Enable **Cloudinary** uploading in the code (we kept the legacy code for this, just uncomment it in `api/generate-video`).
    2. Or attach a **Render Disk** (requires a paid plan) and mount it to `/app/public/videos`.

## Troubleshooting

* **Build Failures**: Check the logs. If it says "OOM" (Out of Memory), you might need a plan with more RAM, though the Dockerfile is optimized to be lightweight.
* **Slow Rendering**: Video generation uses CPU. The Free tier has shared, slow CPUs. A paid instance will render videos much faster.
