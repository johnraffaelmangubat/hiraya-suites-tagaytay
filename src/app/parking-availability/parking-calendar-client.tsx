"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type CalendarResponse = { busyDates?: string[]; updatedAt?: string; error?: string };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ParkingAvailabilityPage() {
  const today = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "2000";
    return { year: Number(get("year")), month: Number(get("month")) - 1, day: Number(get("day")) };
  }, []);

  const [month, setMonth] = useState({ year: today.year, month: today.month });
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parking-availability", { cache: "no-store" });
      const data = (await response.json()) as CalendarResponse;
      if (!response.ok) throw new Error(data.error || "Could not load parking availability.");
      setBusyDates(new Set(data.busyDates ?? []));
      setUpdatedAt(data.updatedAt ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load parking availability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAvailability(); }, [loadAvailability]);

  const firstWeekday = new Date(Date.UTC(month.year, month.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}`, day: 0 })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: dateKey(month.year, month.month, index + 1), day: index + 1 })),
  ];
  while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, day: 0 });

  const moveMonth = (amount: number) => setMonth((current) => {
    const next = new Date(Date.UTC(current.year, current.month + amount, 1));
    return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
  });
  const isPast = (day: number) => dateKey(month.year, month.month, day) < dateKey(today.year, today.month, today.day);

  return (
    <main className="parking-page">
      <div className="parking-shell">
        <Link href="/" className="parking-back"><ArrowLeft size={16} /> Hiraya Suites</Link>

        <header className="parking-heading">
          <span className="parking-eyebrow">PARKING INFORMATION</span>
          <h1>Parking Availability</h1>
          <p>Check the calendar before asking about parking for your stay in Tagaytay.</p>
        </header>

        <section className="parking-card" aria-label="Parking availability calendar">
          <div className="parking-card-head">
            <div className="parking-title">
              <span className="parking-icon"><CalendarDays size={21} /></span>
              <div><h2>Parking calendar</h2><p>Availability is synced from our calendar.</p></div>
            </div>
            <button className="parking-refresh" onClick={() => void loadAvailability()} disabled={loading} aria-label="Refresh calendar">
              <RefreshCw size={16} className={loading ? "parking-spin" : ""} /><span>Refresh</span>
            </button>
          </div>

          <div className="parking-month-bar">
            <button className="parking-month-button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={20} /></button>
            <h3>{MONTHS[month.month]} {month.year}</h3>
            <button className="parking-month-button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={20} /></button>
          </div>

          {error ? (
            <div className="parking-error" role="alert">
              <p>{error}</p>
              <button className="parking-retry" onClick={() => void loadAvailability()}>Try again</button>
            </div>
          ) : (
            <>
              <div className="parking-calendar-grid" role="grid" aria-label={`${MONTHS[month.month]} ${month.year}`}>
                {WEEKDAYS.map((day) => <div className="parking-weekday" key={day} role="columnheader">{day}</div>)}
                {cells.map((cell) => {
                  if (!cell.day) return <div className="parking-day parking-empty" key={cell.key} aria-hidden="true" />;
                  const key = cell.key;
                  const occupied = busyDates.has(key);
                  const past = isPast(cell.day);
                  const status = past ? "Past date" : occupied ? "Unavailable" : loading ? "Checking" : "Available";
                  return (
                    <div className={`parking-day ${past ? "is-past" : occupied ? "is-busy" : "is-free"} ${loading ? "is-loading" : ""}`} key={key} role="gridcell" aria-label={`${MONTHS[month.month]} ${cell.day}: ${status}`}>
                      <span>{cell.day}</span>
                      {!past && !loading && <small>{occupied ? "Booked" : "Available"}</small>}
                    </div>
                  );
                })}
              </div>
              <div className="parking-legend">
                <span><i className="legend-dot legend-free" /> Available</span>
                <span><i className="legend-dot legend-busy" /> Unavailable</span>
                <span><i className="legend-dot legend-past" /> Past date</span>
              </div>
            </>
          )}

          <div className="parking-note">
            <strong>Please note</strong>
            <p>Calendar availability can change. Please message Hiraya Suites to confirm parking availability for your exact dates before making payment. Parking is subject to a separate fee.</p>
          </div>
          <div className="parking-updated">
            {loading ? "Checking latest availability…" : updatedAt ? `Last checked ${new Date(updatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" })}` : "Availability not yet confirmed"}
          </div>
        </section>
        <footer className="parking-footer">Hiraya Suites Tagaytay <span>·</span> Your little pause from the everyday</footer>
      </div>
    </main>
  );
}
