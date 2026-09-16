import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { readAvailability } from "@/lib/availability";
import { getNights, getQuote, getUnit, isDateKey, UNITS, type UnitId } from "@/lib/stay";

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return NextResponse.json({ error: "Your message is too long." }, { status: 413 });
    }
    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Please send a valid inquiry." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please send a valid inquiry." }, { status: 400 });
    }
    const unitId = typeof body.unitId === "string" && UNITS.some((u) => u.id === body.unitId) ? body.unitId as UnitId : null;
    if (!unitId) return NextResponse.json({ error: "Please choose one of our suites before sending your inquiry." }, { status: 400 });
    const unit = getUnit(unitId);

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const guests = Number(body.guests);
    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Please enter your name (2–100 characters)." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (phone.length > 30) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    if (message.length < 10 || message.length > 2000) return NextResponse.json({ error: "Your message should be between 10 and 2,000 characters." }, { status: 400 });
    if (!Number.isInteger(guests) || guests < 1 || guests > unit.maxGuests) return NextResponse.json({ error: `${unit.shortName} accommodates 1–${unit.maxGuests} guests.` }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: "Please agree to the use of your details to respond to your inquiry." }, { status: 400 });

    const hasDates = Boolean(body.checkIn || body.checkOut);
    let estimatedTotal: number | null = null;
    if (hasDates) {
      if (!isDateKey(body.checkIn) || !isDateKey(body.checkOut)) return NextResponse.json({ error: "Please choose valid check-in and check-out dates." }, { status: 400 });
      const availability = await readAvailability();
      const unitAvailability = availability.units.find((u) => u.id === unitId)!;
      if (body.checkIn < availability.today || body.checkOut <= body.checkIn || body.checkOut > availability.maxDate) return NextResponse.json({ error: "Please choose future dates within the next year, with check-out after check-in." }, { status: 400 });
      const nights = getNights(body.checkIn, body.checkOut);
      if (nights.length < unit.minNights || nights.length > unit.maxNights) return NextResponse.json({ error: `${unit.shortName} accepts stays from ${unit.minNights} to ${unit.maxNights} nights. For longer visits, please send a general inquiry.` }, { status: 400 });
      if (nights.some((date) => unitAvailability.blockedDates.includes(date))) return NextResponse.json({ error: `Some of those dates are reserved for ${unit.shortName}. Please refresh the calendar or choose the other suite.` }, { status: 409 });
      estimatedTotal = getQuote(unitId, body.checkIn, body.checkOut).total;
    }
    const recent = await db.select({ id: inquiries.id }).from(inquiries).where(and(eq(inquiries.email, email), gte(inquiries.createdAt, new Date(Date.now() - 15 * 60 * 1000)))).limit(5);
    if (recent.length >= 5) return NextResponse.json({ error: "You’ve sent a few inquiries recently. Please try again in 15 minutes." }, { status: 429 });

    const [inquiry] = await db.insert(inquiries).values({
      unitId,
      name,
      email,
      phone: phone || null,
      guests,
      checkIn: hasDates ? body.checkIn : null,
      checkOut: hasDates ? body.checkOut : null,
      message,
      estimatedTotal,
    }).returning({ id: inquiries.id });
    return NextResponse.json({ reference: `HIR-${inquiry.id.slice(0, 8).toUpperCase()}`, suite: unit.shortName, message: "Your inquiry has been saved. No payment has been taken and your dates are not yet reserved." }, { status: 201 });
  } catch (error) {
    console.error("Inquiry could not be saved:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "We couldn’t save your inquiry right now. Please try again shortly." }, { status: 503 });
  }
}
