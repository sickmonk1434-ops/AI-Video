import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing Render ID" }, { status: 400 });
    }

    const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
    const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || "sandbox";
    const SHOTSTACK_URL = `https://api.shotstack.io/${SHOTSTACK_ENV}/render/${id}`;

    try {
        const res = await fetch(SHOTSTACK_URL, {
            headers: {
                "x-api-key": SHOTSTACK_API_KEY || "",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch status from Shotstack");
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
