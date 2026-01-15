
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing Render ID" }, { status: 400 });
    }

    try {
        // Query DB for status
        const { db } = await import("@/lib/db");
        const result = await db.execute({
            sql: "SELECT status, video_url FROM projects WHERE id = ?",
            args: [id]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const project = result.rows[0];

        // If status is 'done', return the Cloudinary URL (or valid video_url)
        if (project.status === "done" && project.video_url) {
            return NextResponse.json({
                response: {
                    status: "done",
                    url: project.video_url
                }
            });
        }

        if (project.status === "failed") {
            return NextResponse.json({
                response: {
                    status: "failed"
                }
            });
        }

        // Default to processing
        return NextResponse.json({
            response: {
                status: "rendering"
            }
        });

    } catch (e) {
        console.error("Status Check Error:", e);
        return NextResponse.json({ error: "Status check failed" }, { status: 500 });
    }
}
