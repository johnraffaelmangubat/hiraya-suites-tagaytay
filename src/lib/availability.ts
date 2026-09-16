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

  console.log("[availability] Starting database query...");
  console.log("[availability] Today:", today);
  console.log("[availability] Max date:", maxDate);

  try {
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
      "[availability] Database query successful."
    );

    console.log(
      "[availability] Rows returned:",
      rows.length
    );

    const blockedByUnit =
      UNITS.reduce<Record<UnitId, string[]>>(
        (acc, unit) => {
          acc[unit.id] = [];
          return acc;
        },
        {} as Record<UnitId, string[]>
      );

    for (const row of rows) {
      const unitId = row.unitId as UnitId;

      if (!blockedByUnit[unitId]) {
        console.warn(
          `[availability] Unknown unit ID: ${row.unitId}`
        );

        continue;
      }

      blockedByUnit[unitId].push(row.date);
    }

    let isDemo = false;

    /*
     * If there are no blocked dates,
     * create the demo dates.
     */
    if (rows.length === 0) {
      console.log(
        "[availability] No blocked dates found."
      );

      const demo = getDemoBlockedDates(today);

      const values = UNITS.flatMap((unit) =>
        demo[unit.id].map((date) => ({
          unitId: unit.id,
          date,
        }))
      );

      console.log(
        "[availability] Demo rows to insert:",
        values.length
      );

      if (values.length > 0) {
        await db
          .insert(blockedDates)
          .values(values)
          .onConflictDoNothing();
      }

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
    }

    const units = UNITS.map((unit) => ({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      blockedDates: blockedByUnit[unit.id] ?? [],
    }));

    console.log(
      "[availability] Availability loaded successfully."
    );

    return {
      today,
      maxDate,
      units,
      isDemo,
    };
  } catch (error) {
    console.error(
      "[availability] Database query failed:"
    );

    console.error(error);

    throw error;
  }
}
