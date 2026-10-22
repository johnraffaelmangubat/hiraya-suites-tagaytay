import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function unfoldLines(value: string): string[] {
  return value.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
}

function dateKey(value: string): string | null {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T\d{6}(?:Z)?)?$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function toUtcDate(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`);
}

function addDay(key: string): string {
  const date = toUtcDate(key);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseBusyDates(ics: string): string[] {
  const dates = new Set<string>();
  let event: { start?: string; end?: string } | null = null;

  for (const line of unfoldLines(ics)) {
    if (line === "BEGIN:VEVENT") {
      event = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (event?.start) {
        const start = event.start;
        const end = event.end;
        // A same-day timed event still occupies that calendar date.
        if (!end || end <= start) {
          dates.add(start);
        } else {
          for (let date = start; date < end; date = addDay(date)) {
            dates.add(date);
          }
        }
      }
      event = null;
      continue;
    }
    if (!event) continue;

    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const property = line.slice(0, separator).split(";")[0];
    const value = line.slice(separator + 1);
    if (property === "DTSTART") {
      const parsed = dateKey(value);
      if (parsed) event.start = parsed;
    } else if (property === "DTEND") {
      const parsed = dateKey(value);
      if (parsed) event.end = parsed;
    }
  }

  return [...dates].sort();
}

export async function GET() {
  const calendarUrl = process.env.GOOGLE_PARKING_ICAL_URL;

  if (!calendarUrl) {
    return NextResponse.json(
      { error: "Parking calendar is not configured yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const response = await fetch(calendarUrl, {
      cache: "no-store",
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8" },
    });

    if (!response.ok) {
      throw new Error(`Google Calendar returned HTTP ${response.status}`);
    }

    const ics = await response.text();
    if (!ics.includes("BEGIN:VCALENDAR")) {
      throw new Error("The calendar feed did not return a valid iCalendar file.");
    }

    return NextResponse.json(
      { busyDates: parseBusyDates(ics), updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[parking-availability] Could not load Google Calendar:", error);
    return NextResponse.json(
      { error: "Parking availability is temporarily unavailable. Please message us to confirm." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
