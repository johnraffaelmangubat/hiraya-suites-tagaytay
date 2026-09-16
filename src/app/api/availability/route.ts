import { NextResponse } from "next/server";
import { readAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readAvailability(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Availability could not be loaded:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "We couldn’t load the calendar. Please try again in a moment." }, { status: 503 });
  }
}
