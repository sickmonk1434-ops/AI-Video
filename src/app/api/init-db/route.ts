import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

export async function GET() {
    try {
        await initDB();
        return NextResponse.json({ message: "Database initialized successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
