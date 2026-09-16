import { NextResponse } from "next/server";
import { readAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const availability = await readAvailability();

    return NextResponse.json(availability, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Availability could not be loaded:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
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
