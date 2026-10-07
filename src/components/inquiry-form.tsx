"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Modal from "@/components/modal";
import { type DateRange } from "@/components/calendar";
import {
  formatDate,
  formatMoney,
  getQuote,
  type Unit,
} from "@/lib/stay";

type InquiryFormProps = {
  unit: Unit;
  range: DateRange;
  guests: number;
  onClose: () => void;
};

const DOWNPAYMENT = 1000;
const SECURITY_DEPOSIT = 500;

export default function InquiryForm({
  unit,
  range,
  guests,
  onClose,
}: InquiryFormProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [copyText, setCopyText] = useState("");
  const [copied, setCopied] = useState(false);

  const hasDates = Boolean(range.start && range.end);

  const quote = hasDates
    ? getQuote(
        unit.id,
        range.start,
        range.end,
        guests
      )
    : null;

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (sending) return;

    setSending(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        "/api/inquiries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unitId: unit.id,
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            message: form.get("message"),
            guests,
            checkIn: hasDates
              ? range.start
              : null,
            checkOut: hasDates
              ? range.end
              : null,
            consent:
              form.get("consent") === "on",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Something went wrong. Please try again."
        );
      }

      setReference(result.reference);

      const submittedName = String(
        form.get("name") || ""
      );

      const submittedEmail = String(
        form.get("email") || ""
      );

      const submittedPhone = String(
        form.get("phone") || ""
      ).trim();

      const submittedMessage = String(
        form.get("message") || ""
      );

      const estimatedTotal = quote?.total || 0;
      const remainingBalance = Math.max(
        estimatedTotal - DOWNPAYMENT,
        0
      );

      const totalRemaining = remainingBalance + SECURITY_DEPOSIT;

      setCopyText([
  "Hi Hiraya Suites! I just submitted an inquiry through your website.",
  "",
  `Inquiry reference: ${result.reference}`,
  `Name: ${submittedName}`,
  `Email: ${submittedEmail}`,
  `Phone: ${submittedPhone || "Not provided"}`,
  `Suite: ${result.suite || unit.shortName}`,
  `Check-in: ${hasDates ? formatDate(range.start, true) : "Not selected"}`,
  `Check-out: ${hasDates ? formatDate(range.end, true) : "Not selected"}`,
  `Guests: ${guests}`,
  `Estimated total: ${quote ? formatMoney(quote.total) : "Not available"}`,
  "",
  "Payment breakdown:",
  `Downpayment: ${formatMoney(1000)}`,
  `Remaining room balance: ...`,
  ...
].join("\n"));

      setCopied(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Please check your connection and try again."
      );
    } finally {
      setSending(false);
    }
  }

  function openPaymentPage() {
    if (!reference) return;

    const estimatedTotal = quote?.total || 0;

    const params = new URLSearchParams({
      reference,
      name: "",
      suite: unit.shortName,
      guests: String(guests),
      total: String(estimatedTotal),
      checkIn: hasDates
        ? formatDate(range.start)
        : "",
      checkOut: hasDates
        ? formatDate(range.end, true)
        : "",
    });

    window.location.href = `/payment?${params.toString()}`;
  }

  return (
    <Modal
      title={
        reference
          ? "A lovely first step."
          : `Planning your stay in ${unit.shortName}.`
      }
      subtitle={
        reference
          ? undefined
          : "Tell us a little about yourself. Good stays begin with a hello."
      }
      onClose={onClose}
    >
      {reference ? (
        <div
          className="inquiry-success"
          role="status"
        >
          <div className="success-mark">
            <Check size={30} />
          </div>

          <h3>Your inquiry is in.</h3>

          <p>
            We’ve received your inquiry and saved a copy
            of your details. You can now proceed with the
            downpayment to continue your booking.
          </p>

          <div className="inquiry-reference">
            <span>
              YOUR INQUIRY REFERENCE
            </span>

            <strong>{reference}</strong>
          </div>

          {hasDates && (
            <p className="success-dates">
              {formatDate(range.start)} –{" "}
              {formatDate(range.end, true)} ·{" "}
              {guests}{" "}
              {guests === 1
                ? "guest"
                : "guests"}{" "}
              · {unit.shortName}
            </p>
          )}

          {quote && (
            <div className="inquiry-payment-preview">
              <div>
                <span>Estimated stay</span>
                <strong>
                  {formatMoney(quote.total)}
                </strong>
              </div>

              <div>
                <span>Downpayment</span>
                <strong>
                  {formatMoney(DOWNPAYMENT)}
                </strong>
              </div>

              <div>
                <span>Remaining room balance</span>
                <strong>
                  {formatMoney(
                    Math.max(
                      quote.total -
                        DOWNPAYMENT,
                      0
                    )
                  )}
                </strong>
              </div>
            </div>
          )}

          <button
            type="button"
            className="button button-primary full-width inquiry-payment-button"
            onClick={openPaymentPage}
          >
            Proceed with your downpayment
            <ArrowUpRight size={18} />
          </button>

          <div className="inquiry-messenger-note">
            <p>
              You can also continue on Messenger. Tap{" "}
              <strong>Copy inquiry details</strong> first,
              then paste the message into our chat.
            </p>
          </div>

          <button
            type="button"
            className="button button-primary full-width copy"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  copyText
                );

                setCopied(true);
              } catch {
                setCopied(false);

                setError(
                  "We couldn’t copy automatically. Please try again or use your browser’s copy option."
                );
              }
            }}
          >
            {copied ? (
              <Check size={18} />
            ) : (
              <Copy size={18} />
            )}

            {copied
              ? "Inquiry details copied!"
              : "Copy inquiry details"}
          </button>

          <a
            className="button button-primary full-width inquiry-messenger-button"
            href="https://m.me/HirayaSuitesTagaytay"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} />
            Continue on Messenger
            <ArrowUpRight size={18} />
          </a>

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <p className="fine-print">
            This is an inquiry and not yet a confirmed
            reservation. Your booking is subject to
            confirmation by Hiraya Suites.
          </p>

          <button
            type="button"
            className="button button-primary full-width"
            onClick={onClose}
          >
            Back to your getaway
            <ArrowUpRight size={18} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="inquiry-form"
        >
          {hasDates && quote && (
            <div className="inquiry-stay">
              <CalendarDays size={24} />

              <div>
                <strong>
                  {unit.shortName} ·{" "}
                  {formatDate(range.start)} –{" "}
                  {formatDate(
                    range.end,
                    true
                  )}
                </strong>

                <span>
                  {quote.nights}{" "}
                  {quote.nights === 1
                    ? "night"
                    : "nights"}{" "}
                  · {guests}{" "}
                  {guests === 1
                    ? "guest"
                    : "guests"}{" "}
                  ·{" "}
                  {formatMoney(
                    quote.total
                  )}{" "}
                  estimated total
                </span>

                {quote.additionalGuests >
                  0 && (
                  <span>
                    Includes ₱
                    {formatMoney(
                      quote.additionalGuestTotal
                    ).replace("₱", "")}{" "}
                    additional guest fee
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="inquiry-suite-note">
            <small>Selected suite:</small>
            <strong>{unit.name}</strong>
          </div>

          <div className="form-row">
            <label>
              Your name

              <input
                name="name"
                autoComplete="name"
                placeholder="e.g. Alex Santos"
                minLength={2}
                maxLength={100}
                required
              />
            </label>

            <label>
              Email address

              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
          </div>

          <label>
            Phone number{" "}
            <span className="optional">
              (optional)
            </span>

            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+63 9XX XXX XXXX"
              maxLength={30}
            />
          </label>

          <label>
            A little about your stay

            <textarea
              name="message"
              placeholder={`A quiet weekend in ${unit.shortName}, a special occasion, or a question for us…`}
              defaultValue={
                hasDates
                  ? `Hi! I’d love to inquire about ${unit.shortName} for ${guests} ${
                      guests === 1
                        ? "guest"
                        : "guests"
                    } from ${formatDate(
                      range.start
                    )} to ${formatDate(
                      range.end,
                      true
                    )}. Please let me know the next steps.`
                  : ""
              }
              minLength={10}
              maxLength={2000}
              rows={4}
              required
            />
          </label>

          <label className="checkbox-label">
            <input
              name="consent"
              type="checkbox"
              required
            />

            <span>
              I agree to have my contact details
              stored and used to respond to this
              inquiry.
            </span>
          </label>

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="button button-primary full-width"
            type="submit"
            disabled={sending}
          >
            {sending ? (
              <>
                <LoaderCircle
                  size={18}
                  className="spin"
                />
                Sending your inquiry…
              </>
            ) : (
              <>
                Send my inquiry
                <ArrowUpRight size={18} />
              </>
            )}
          </button>

          <p className="form-reassurance">
            <ShieldCheck size={14} />
            No payment required. Just the start of
            something lovely.
          </p>

          <p className="fine-print">
            Rates shown are based on your selected
            dates and number of guests. Inquiries do
            not reserve dates until confirmed by
            Hiraya Suites.
          </p>
        </form>
      )}
    </Modal>
  );
}
