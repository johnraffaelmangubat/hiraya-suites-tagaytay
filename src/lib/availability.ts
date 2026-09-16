import { db } from "@/db";
import { blockedDates } from "@/db/schema";
import { and, asc, gte, lte } from "drizzle-orm";
import { addDays, getDemoBlockedDates, todayInManila, UNITS, type UnitId } from "@/lib/stay";

export async function readAvailability() {
  const today = todayInManila();
  const maxDate = addDays(today, 365);
  const rows = await db.select({ unitId: blockedDates.unitId, date: blockedDates.date })
    .from(blockedDates)
    .where(and(gte(blockedDates.date, today), lte(blockedDates.date, maxDate)))
    .orderBy(asc(blockedDates.unitId), asc(blockedDates.date));
  const blockedByUnit = UNITS.reduce<Record<UnitId, string[]>>((acc, unit) => { acc[unit.id] = []; return acc; }, { hiraya: [], mayumi: [] });
  for (const row of rows) blockedByUnit[row.unitId as UnitId]?.push(row.date);
  let isDemo = false;
  if (rows.length === 0) {
    const demo = getDemoBlockedDates(today);
    const values = UNITS.flatMap((unit) => demo[unit.id].map((date) => ({ unitId: unit.id, date })));
    await db.insert(blockedDates).values(values).onConflictDoNothing();
    const fresh = await db.select({ unitId: blockedDates.unitId, date: blockedDates.date })
      .from(blockedDates).where(and(gte(blockedDates.date, today), lte(blockedDates.date, maxDate))).orderBy(asc(blockedDates.unitId), asc(blockedDates.date));
    for (const row of fresh) blockedByUnit[row.unitId as UnitId]?.push(row.date);
    isDemo = true;
  }
  return { today, maxDate, units: UNITS.map((unit) => ({ id: unit.id, name: unit.name, shortName: unit.shortName, blockedDates: blockedByUnit[unit.id] })), isDemo };
}
