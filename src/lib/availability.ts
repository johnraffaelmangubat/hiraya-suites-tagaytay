import { db } from "@/db";
import { blockedDates } from "@/db/schema";
import { and, asc, gte, lte } from "drizzle-orm";
import {
  addDays,
  getDemoBlockedDates,
  todayInManila,
  UNITS,
  type UnitId,
} from "@/lib/stay";

export async function readAvailability() {
  try {
    const today = todayInManila();
    const maxDate = addDays(today, 365);

    console.log("[availability] Loading dates:", {
      today,
      maxDate,
    });

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

    console.log("[availability] Database rows:", rows.length);

    const blockedByUnit = UNITS.reduce<Record<UnitId, string[]>>(
      (acc, unit) => {
        acc[unit.id] = [];
        return acc;
      },
      {} as Record<UnitId, string[]>
    );

    for (const row of rows) {
      const unitId = row.unitId as UnitId;

      if (blockedByUnit[unitId]) {
        blockedByUnit[unitId].push(row.date);
      }
    }

    let isDemo = false;

    /*
     * If the database has no blocked dates yet,
     * populate it with the demo dates.
     */
    if (rows.length === 0) {
      console.log("[availability] No blocked dates found. Creating demo data.");

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

        if (blockedByUnit[unitId]) {
          blockedByUnit[unitId].push(row.date);
        }
      }

      isDemo = true;

      console.log(
        "[availability] Demo dates created:",
        fresh.length
      );
    }

    const units = UNITS.map((unit) => ({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      blockedDates: blockedByUnit[unit.id],
    }));

    console.log("[availability] Successfully loaded.");

    return {
      today,
      maxDate,
      units,
      isDemo,
    };
  } catch (error) {
    console.error(
      "[availability] Failed to load availability:",
      error
    );

    throw new Error("Failed to load availability data.");
  }
}
