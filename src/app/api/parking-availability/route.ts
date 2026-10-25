
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PARKING_TIME_ZONE = "Asia/Manila";

type CalendarDateTime = {
  value: string;
  timeZone?: string;
};

type CalendarEvent = {
  start?: CalendarDateTime;
  end?: CalendarDateTime;
};

function unfoldLines(value: string): string[] {
  return value
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
}

function dateKeyFromParts(
  year: string,
  month: string,
  day: string
): string {
  return `${year}-${month}-${day}`;
}

function parseCalendarDateTime(
  rawValue: string,
  parameters: string
): CalendarDateTime | null {
  const value = rawValue.trim();

  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/
  );

  if (!match) return null;

  const timeZoneMatch = parameters.match(
    /(?:^|;)TZID=([^;:]+)/i
  );

  const timeZone = timeZoneMatch?.[1];

  // All-day dates and Manila-local dates already use
  // the correct local calendar date.
  if (
    !match[4] ||
    (timeZone &&
      timeZone.toLowerCase() ===
        PARKING_TIME_ZONE.toLowerCase())
  ) {
    return {
      value: dateKeyFromParts(
        match[1],
        match[2],
        match[3]
      ),
      timeZone,
    };
  }

  // UTC timestamps must be converted to Philippine dates.
  if (match[7]) {
    const instant = new Date(
      `${match[1]}-${match[2]}-${match[3]}T` +
        `${match[4]}:${match[5]}:${match[6]}Z`
    );

    if (Number.isNaN(instant.getTime())) return null;

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: PARKING_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);

    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value;

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");

    if (!year || !month || !day) return null;

    return {
      value: dateKeyFromParts(year, month, day),
      timeZone: PARKING_TIME_ZONE,
    };
  }

  // Preserve the written date for other non-UTC events
  // instead of accidentally shifting them by a day.
  return {
    value: dateKeyFromParts(
      match[1],
      match[2],
      match[3]
    ),
    timeZone,
  };
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
  let event: CalendarEvent | null = null;

  for (const line of unfoldLines(ics)) {
    if (line === "BEGIN:VEVENT") {
      event = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (event?.start) {
        const start = event.start.value;
        const end = event.end?.value;

        // DTSTART is inclusive and DTEND is exclusive.
        // This keeps a checkout date available unless
        // another event blocks that date.
        if (!end || end <= start) {
          dates.add(start);
        } else {
          for (
            let date = start;
            date < end;
            date = addDay(date)
          ) {
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

    const propertyAndParameters = line.slice(0, separator);
    const value = line.slice(separator + 1);

    const property = propertyAndParameters
      .split(";")[0]
      .toUpperCase();

    if (property !== "DTSTART" && property !== "DTEND") {
      continue;
    }

    const parsed = parseCalendarDateTime(
      value,
      propertyAndParameters
    );

    if (!parsed) continue;

    if (property === "DTSTART") event.start = parsed;
    if (property === "DTEND") event.end = parsed;
  }

  return [...dates].sort();
}

export async function GET() {
  const calendarUrl = process.env.GOOGLE_PARKING_ICAL_URL;

  if (!calendarUrl) {
    return NextResponse.json(
      { error: "Parking calendar is not configured yet." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const response = await fetch(calendarUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Google Calendar returned HTTP ${response.status}`
      );
    }

    const ics = await response.text();

    if (!ics.includes("BEGIN:VCALENDAR")) {
      throw new Error(
        "The calendar feed did not return a valid iCalendar file."
      );
    }

    return NextResponse.json(
      {
        busyDates: parseBusyDates(ics),
        updatedAt: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "[parking-availability] Could not load Google Calendar:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Parking availability is temporarily unavailable. Please message us to confirm.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
