import { db } from "@/db";
import { blockedDates } from "@/db/schema";
import {
  and,
  asc,
  gte,
  lte,
} from "drizzle-orm";

import {
  addDays,
  getDemoBlockedDates,
  todayInManila,
  UNITS,
  type UnitId,
} from "@/lib/stay";

export async function readAvailability() {
  const today = todayInManila();
  const maxDate = addDays(today, 365);

  try {
    console.log("[availability] Starting...");
    console.log("[availability] Today:", today);
    console.log("[availability] Max date:", maxDate);

    /*
     * Test the database query.
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
      "[availability] Found rows:",
      rows.length
    );

    /*
     * Create an empty blocked-date array
     * for every configured unit.
     */
    const blockedByUnit =
      UNITS.reduce<Record<UnitId, string[]>>(
        (acc, unit) => {
          acc[unit.id] = [];
          return acc;
        },
        {} as Record<UnitId, string[]>
      );

    /*
     * Put database dates into their respective units.
     */
    for (const row of rows) {
      const unitId = row.unitId as UnitId;

      if (!blockedByUnit[unitId]) {
        console.warn(
          `[availability] Unknown unitId in database: ${row.unitId}`
        );

        continue;
      }

      blockedByUnit[unitId].push(row.date);
    }

    let isDemo = false;

    /*
     * If the database is empty, create demo reservations.
     *
     * This is only intended for initial/demo data.
     */
    if (rows.length === 0) {
      console.log(
        "[availability] No reservations found. Creating demo dates..."
      );

      const demo = getDemoBlockedDates(today);

      const values = UNITS.flatMap((unit) =>
        demo[unit.id].map((date) => ({
          unitId: unit.id,
          date,
        }))
      );

      if (values.length > 0) {
        await db
          .insert(blockedDates)
          .values(values)
          .onConflictDoNothing();
      }

      /*
       * Read the dates again after insertion.
       */
      const fresh = await db
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

      for (const row of fresh) {
        const unitId = row.unitId as UnitId;

        if (!blockedByUnit[unitId]) {
          continue;
        }

        blockedByUnit[unitId].push(row.date);
      }

      isDemo = true;

      console.log(
        "[availability] Demo dates inserted:",
        fresh.length
      );
    }

    const units = UNITS.map((unit) => ({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      blockedDates: blockedByUnit[unit.id],
    }));

    console.log(
      "[availability] Successfully loaded:",
      units
    );

    return {
      today,
      maxDate,
      units,
      isDemo,
    };
  } catch (error) {
    console.error(
      "[availability] DATABASE ERROR:",
      error
    );

    /*
     * Preserve the original error so Next.js/server logs
     * show the real PostgreSQL/Drizzle error.
     */
    throw error;
  }
}
