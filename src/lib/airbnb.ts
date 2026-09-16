import { isDateKey, type UnitId } from "@/lib/stay";

type AirbnbEvent = {
  start: string;
  end: string;
};

function unfoldIcsLines(ics: string): string[] {
  return ics
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
}

function parseIcsDate(value: string): string | null {
  const clean = value.trim();

  const match = clean.match(
    /^(\d{4})(\d{2})(\d{2})(?:T\d{6}(?:Z)?)?$/
  );

  if (!match) {
    return null;
  }

  const key = `${match[1]}-${match[2]}-${match[3]}`;

  return isDateKey(key) ? key : null;
}

function parseAirbnbEvents(ics: string): AirbnbEvent[] {
  const lines = unfoldIcsLines(ics);
  const events: AirbnbEvent[] = [];

  let current: Partial<AirbnbEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current?.start && current?.end) {
        events.push({
          start: current.start,
          end: current.end,
        });
      }

      current = null;
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith("DTSTART")) {
      const value = line.split(":").slice(1).join(":");
      const date = parseIcsDate(value);

      if (date) {
        current.start = date;
      }

      continue;
    }

    if (line.startsWith("DTEND")) {
      const value = line.split(":").slice(1).join(":");
      const date = parseIcsDate(value);

      if (date) {
        current.end = date;
      }
    }
  }

  return events;
}

export async function getAirbnbBlockedDates(
  unitId: UnitId
): Promise<string[]> {
  if (unitId !== "hiraya") {
    return [];
  }

  const url = process.env.AIRBNB_HIRAYA_ICAL_URL;

  if (!url) {
    console.warn(
      "[airbnb] AIRBNB_HIRAYA_ICAL_URL is not configured."
    );

    return [];
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Airbnb calendar returned HTTP ${response.status}`
      );
    }

    const ics = await response.text();
    const events = parseAirbnbEvents(ics);

    const blocked = new Set<string>();

    for (const event of events) {
      let date = event.start;

      while (date < event.end) {
        blocked.add(date);

        const current = new Date(`${date}T12:00:00`);
        current.setDate(current.getDate() + 1);

        date = current.toISOString().slice(0, 10);
      }
    }

    console.log(
      `[airbnb] ${unitId}: ${blocked.size} blocked dates found.`
    );

    return [...blocked].sort();
  } catch (error) {
    console.error(
      "[airbnb] Failed to read Airbnb calendar:",
      error
    );

    return [];
  }
}
