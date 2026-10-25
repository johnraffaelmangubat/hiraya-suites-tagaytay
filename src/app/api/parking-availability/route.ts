
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PARKING_TIME_ZONE = "Asia/Manila";

type CalendarDateTime = {
  value: string;
  time?: string;
  isDateOnly: boolean;
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

function dateKey(year: string, month: string, day: string): string {
  return `${year}-${month}-${day}`;
}

function getTimeZoneParts(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
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

  const isDateOnly = !match[4];

  if (isDateOnly) {
    return {
      value: dateKey(match[1], match[2], match[3]),
      isDateOnly: true,
    };
  }

  const timeZoneMatch = parameters.match(
    /(?:^|;)TZID=([^;:]+)/i
  );

  const timeZone = timeZoneMatch?.[1];
  let year = match[1];
  let month = match[2];
  let day = match[3];
  let hour = match[4];
  let minute = match[5];
  let second = match[6];

  // UTC timestamps must be converted into Philippine local time.
  if (match[7]) {
    const instant = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
    );

    if (Number.isNaN(instant.getTime())) return null;

    const parts = getTimeZoneParts(instant);

    if (
      !parts.year ||
      !parts.month ||
      !parts.day ||
      !parts.hour ||
      !parts.minute ||
      !parts.second
    ) {
      return null;
    }

    year = parts.year;
    month = parts.month;
    day = parts.day;
    hour = parts.hour;
    minute = parts.minute;
    second = parts.second;
  } else if (
    timeZone &&
    timeZone.toLowerCase() !== PARKING_TIME_ZONE.toLowerCase()
  ) {
    // Do not silently reinterpret another named timezone as Manila.
    // Preserve its written date until timezone-specific handling is added.
  }

  return {
    value: dateKey(year, month, day),
    time: `${hour}${minute}${second}`,
    isDateOnly: false,
  };
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function addDay(value: string): string {
  const date = toUtcDate(value);
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
      const start = event?.start;
      const end = event?.end;

      if (start) {
        const startDate = start.value;
        const endDate = end?.value;

        if (!end || !endDate || endDate < startDate) {
          dates.add(startDate);
        } else {
          // Block every calendar date the event overlaps.
          // DTSTART is inclusive.
          for (
            let date = startDate;
            date < endDate;
            date = addDay(date)
          ) {
            dates.add(date);
          }

          if (endDate === startDate) {
            // A timed event beginning and ending on the same date
            // still blocks that date.
            dates.add(startDate);
          } else if (
            !end.isDateOnly &&
            end.time &&
            end.time !== "000000"
          ) {
            // All-day DTEND is exclusive.
            // A timed event ending after midnight occupies part
            // of its end date, so block that date too.
            dates.add(endDate);
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
    const rawValue = line.slice(separator + 1);
    const property = propertyAndParameters
      .split(";")[0]
      .toUpperCase();

    if (property !== "DTSTART" && property !== "DTEND") {
      continue;
    }

    const parsed = parseCalendarDateTime(
      rawValue,
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
      throw new Error("Google Calendar returned an invalid calendar feed.");
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
