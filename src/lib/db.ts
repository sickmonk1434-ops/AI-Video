import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Warning instead of hard crash to allow build to pass if keys are missing (logic will fail at runtime)
if (!process.env.TURSO_DATABASE_URL) {
    console.warn("⚠️ TURSO_DATABASE_URL is missing. DB operations will fail.");
}

export const db = createClient({
    url,
    authToken,
});

export type VideoProject = {
    id: string;
    concept: string;
    script: string; // JSON string
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    created_at: number;
}

// Helper to initialize tables if they don't exist
export async function initDB() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            concept TEXT,
            script TEXT,
            status TEXT,
            video_url TEXT,
            created_at INTEGER DEFAULT (unixepoch())
        )
    `);
}
