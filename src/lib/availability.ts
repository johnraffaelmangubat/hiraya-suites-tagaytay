import { db } from "@/db";
import { blockedDates } from "@/db/schema";
import { getAirbnbBlockedDates } from "@/lib/airbnb";
import {
  and,
  asc,
  gte,
  lte,
} from "drizzle-orm";

import {
  addDays,
  todayInManila,
  UNITS,
  type UnitId,
} from "@/lib/stay";

export async function readAvailability() {
  const today = todayInManila();
  const maxDate = addDays(today, 365);

  console.log("[availability] Starting availability query...");
  console.log("[availability] Today:", today);
  console.log("[availability] Max date:", maxDate);

  try {
    /*
     * 1. Read manually blocked dates from Neon.
     */
    const rows = await db
      .select({
        unitId: blockedDates.unitId,
        date: blockedDates.date,
      })
      .from(blockedDates)
      .where(
        and(
          gte(blockedDates.date, today),
          lte(blockedDates.date, maxDate)
        )
      )
      .orderBy(
        asc(blockedDates.unitId),
        asc(blockedDates.date)
      );

    console.log(
      "[availability] Neon rows:",
      rows.length
    );

    /*
     * 2. Get Airbnb blocked dates for Hiraya.
     */
    const airbnbHirayaDates =
      await getAirbnbBlockedDates("hiraya");

    console.log(
      "[availability] Airbnb Hiraya dates:",
      airbnbHirayaDates.length
    );

    /*
     * 3. Build blocked dates by unit.
     */
    const blockedByUnit =
      UNITS.reduce<Record<UnitId, Set<string>>>(
        (acc, unit) => {
          acc[unit.id] = new Set<string>();
          return acc;
        },
        {} as Record<UnitId, Set<string>>
      );

    /*
     * 4. Add manually blocked dates from Neon.
     */
    for (const row of rows) {
      const unitId = row.unitId as UnitId;

      if (!blockedByUnit[unitId]) {
        console.warn(
          `[availability] Unknown unit ID: ${row.unitId}`
        );

        continue;
      }

      blockedByUnit[unitId].add(row.date);
    }

    /*
     * 5. Add Airbnb dates to Hiraya.
     */
    for (const date of airbnbHirayaDates) {
      blockedByUnit.hiraya.add(date);
    }

    /*
     * 6. Convert Sets to sorted arrays.
     */
    const units = UNITS.map((unit) => ({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      blockedDates: [...blockedByUnit[unit.id]].sort(),
    }));

    console.log(
      "[availability] Availability loaded successfully."
    );

    return {
      today,
      maxDate,
      units,
      isDemo: false,
    };
  } catch (error) {
    console.error(
      "[availability] Database query failed:"
    );

    console.error(error);

    throw error;
  }
}
