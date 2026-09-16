"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fromDateKey, getNights, toDateKey, type Unit } from "@/lib/stay";

export type DateRange = { start: string; end: string };

type CalendarProps = {
  unit: Unit;
  today: string;
  maxDate: string;
  blocked: Set<string>;
  range: DateRange;
  onSelect: (date: string) => void;
  onClear: () => void;
  loading?: boolean;
  months?: number;
};

export default function Calendar({ unit, today, maxDate, blocked, range, onSelect, onClear, loading = false, months = 2 }: CalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const date = fromDateKey(range.start || today);
    return new Date(date.getFullYear(), date.getMonth(), 1, 12);
  });
  useEffect(() => {
    if (!range.start) return;
    const selected = fromDateKey(range.start);
    const visibleMonths = window.matchMedia("(max-width: 520px)").matches ? 1 : months;
    setCursor((previous) => {
      const offset = (selected.getFullYear() - previous.getFullYear()) * 12 + selected.getMonth() - previous.getMonth();
      return offset < 0 || offset >= visibleMonths ? new Date(selected.getFullYear(), selected.getMonth(), 1, 12) : previous;
    });
  }, [range.start, months]);

  const currentMonth = new Date(fromDateKey(today).getFullYear(), fromDateKey(today).getMonth(), 1, 12);
  const lastMonth = new Date(fromDateKey(maxDate).getFullYear(), fromDateKey(maxDate).getMonth(), 1, 12);
  const moveMonth = (direction: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1, 12));
  const status = range.end ? `${unit.shortName} — your little getaway is taking shape.` : range.start ? `Now choose your check-out date for ${unit.shortName}.` : `Choose your check-in date for ${unit.shortName}.`;

  return (
    <div className={`calendar ${loading ? "calendar--loading" : ""}`} aria-busy={loading}>
      <div className="calendar-toolbar">
        <p aria-live="polite">{status}</p>
        <div className="calendar-navigation">
          <button type="button" className="icon-button" onClick={() => moveMonth(-1)} disabled={cursor <= currentMonth} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button type="button" className="icon-button" onClick={() => moveMonth(1)} disabled={cursor >= lastMonth} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className={`calendar-months calendar-months--${months}`}>
        {Array.from({ length: months }, (_, monthOffset) => {
          const month = new Date(cursor.getFullYear(), cursor.getMonth() + monthOffset, 1, 12);
          const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          const startOffset = month.getDay();
          return (
            <section className="calendar-month" key={toDateKey(month)} aria-label={monthName}>
              <h4>{monthName}</h4>
              <div className="calendar-weekdays" aria-hidden="true">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
              <div className="calendar-grid">
                {Array.from({ length: startOffset }, (_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}
                {Array.from({ length: total }, (_, index) => {
                  const date = new Date(month.getFullYear(), month.getMonth(), index + 1, 12);
                  const key = toDateKey(date);
                  const isBlocked = blocked.has(key);
                  const isPast = key < today;
                  const candidateNights = isBlocked && range.start && !range.end && key > range.start ? getNights(range.start, key) : [];
                  const checkoutOnly = candidateNights.length > 0 && candidateNights.length >= unit.minNights && candidateNights.length <= unit.maxNights && candidateNights.every((night) => !blocked.has(night));
                  const disabled = loading || (isBlocked && !checkoutOnly) || isPast || key > maxDate;
                  const selected = key === range.start || key === range.end;
                  const inRange = Boolean(range.start && range.end && key > range.start && key < range.end);
                  const classes = ["calendar-day", isBlocked && !selected && !checkoutOnly ? "is-booked" : "", checkoutOnly ? "is-checkout-only" : "", isPast ? "is-past" : "", selected ? "is-selected" : "", inRange ? "is-in-range" : "", key === today ? "is-today" : ""].filter(Boolean).join(" ");
                  const stateLabel = selected ? "selected" : checkoutOnly ? "check-out only" : isBlocked ? "reserved" : isPast ? "past date" : key > maxDate ? "outside booking window" : "available";
                  return <button type="button" key={key} className={classes} disabled={disabled} aria-pressed={selected || inRange}
                    aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${stateLabel}`}
                    title={checkoutOnly ? "Available for check-out only" : undefined}
                    onClick={() => onSelect(key)}><span>{index + 1}</span>{!disabled && !isBlocked && !selected && !inRange && <i aria-hidden="true" />}</button>;
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="calendar-footer">
        <div className="calendar-legend"><span><i className="legend-available" />Available</span><span><i className="legend-booked" />Reserved</span><span><i className="legend-selected" />Selected</span></div>
        <button type="button" className="text-button clear-dates" disabled={!range.start} onClick={onClear}>Clear dates</button>
      </div>
    </div>
  );
}
