"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CalendarDays, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import Modal from "@/components/modal";
import { type DateRange } from "@/components/calendar";
import { formatDate, formatMoney, getQuote, type Unit } from "@/lib/stay";

type InquiryFormProps = { unit: Unit; range: DateRange; guests: number; onClose: () => void };

export default function InquiryForm({ unit, range, guests, onClose }: InquiryFormProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [suiteName, setSuiteName] = useState("");
  const hasDates = Boolean(range.start && range.end);
  const quote = hasDates ? getQuote(unit.id, range.start, range.end) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: unit.id,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
          guests,
          checkIn: hasDates ? range.start : null,
          checkOut: hasDates ? range.end : null,
          consent: form.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
      setReference(result.reference);
      setSuiteName(result.suite || unit.shortName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check your connection and try again.");
    } finally { setSending(false); }
  }

  return (
    <Modal title={reference ? "A lovely first step." : `Planning your stay in ${unit.shortName}.`} subtitle={reference ? undefined : "Tell us a little about yourself. Good stays begin with a hello."} onClose={onClose}>
      {reference ? <div className="inquiry-success" role="status">
        <div className="success-mark"><Check size={30} /></div>
        <h3>Your inquiry is in.</h3>
        <p>We’ve saved your {suiteName} details and message. Keep your reference below for your records.</p>
        <div className="inquiry-reference"><span>YOUR INQUIRY REFERENCE</span><strong>{reference}</strong></div>
        {hasDates && <p className="success-dates">{formatDate(range.start)} – {formatDate(range.end, true)} · {guests} {guests === 1 ? "guest" : "guests"} · {unit.shortName}</p>}
        <p className="fine-print">This is a demo inquiry, not a confirmed reservation. No payment has been taken and no email has been sent.</p>
        <button type="button" className="button button-primary full-width" onClick={onClose}>Back to your getaway <ArrowUpRight size={18} /></button>
      </div> : <form onSubmit={submit} className="inquiry-form">
        {hasDates && quote && <div className="inquiry-stay"><CalendarDays size={24} /><div><strong>{unit.shortName} · {formatDate(range.start)} – {formatDate(range.end, true)}</strong><span>{quote.nights} {quote.nights === 1 ? "night" : "nights"} · {guests} {guests === 1 ? "guest" : "guests"} · {formatMoney(quote.total)} estimated total</span></div></div>}
        <div className="inquiry-suite-note"><small>Selected suite:</small><strong>{unit.name}</strong></div>
        <div className="form-row"><label>Your name<input name="name" autoComplete="name" placeholder="e.g. Alex Santos" minLength={2} maxLength={100} required /></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label></div>
        <label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="+63 9XX XXX XXXX" maxLength={30} /></label>
        <label>A little about your stay<textarea name="message" placeholder={`A quiet weekend in ${unit.shortName}, a special occasion, or a question for us…`} defaultValue={hasDates ? `Hi! I’d love to inquire about ${unit.shortName} for ${guests} ${guests === 1 ? "guest" : "guests"} from ${formatDate(range.start)} to ${formatDate(range.end, true)}. Please let me know the next steps.` : ""} minLength={10} maxLength={2000} rows={4} required /></label>
        <label className="checkbox-label"><input name="consent" type="checkbox" required /><span>I agree to have my contact details stored and used to respond to this inquiry.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-width" type="submit" disabled={sending}>{sending ? <><LoaderCircle size={18} className="spin" /> Sending your inquiry…</> : <>Send my inquiry <ArrowUpRight size={18} /></>}</button>
        <p className="form-reassurance"><ShieldCheck size={14} /> No payment required. Just the start of something lovely.</p>
        <p className="fine-print">Preview experience · Rates and property details are placeholders. Inquiries are saved, but do not reserve dates or send email.</p>
      </form>}
    </Modal>
  );
}
