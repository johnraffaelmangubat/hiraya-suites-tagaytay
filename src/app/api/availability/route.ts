import { NextResponse } from "next/server";
import { readAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const availability = await readAvailability();

    return NextResponse.json(availability, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("====================================");
    console.error("AVAILABILITY API ERROR");
    console.error("====================================");
    console.error(error);
    console.error("====================================");

    const message =
      error instanceof Error
        ? error.message
        : "Unknown database error";

    return NextResponse.json(
      {
        error: "Failed to load availability.",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
