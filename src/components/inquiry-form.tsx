
"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
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

type SuccessStep = "confirmation" | "payment";

const DOWNPAYMENT = 1000;
const SECURITY_DEPOSIT = 500;

type InquiryFormProps = {
  unit: Unit;
  range: DateRange;
  guests: number;
  onClose: () => void;
};

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
  const [successStep, setSuccessStep] =
    useState<SuccessStep>("confirmation");

  const hasDates = Boolean(range.start && range.end);

  const quote = hasDates
    ? getQuote(
        unit.id,
        range.start,
        range.end,
        guests
      )
    : null;

  const balance = quote
    ? Math.max(quote.total - DOWNPAYMENT, 0)
    : 0;

  const totalRemaining = balance + SECURITY_DEPOSIT;

  const qrCode =
    unit.id === "hiraya"
      ? "/images/towerb/qr%20tb.jpg"
      : "/images/tower4/qr%20t4.jpg";

  const qrLabel =
    unit.id === "hiraya"
      ? "Tower B"
      : "Tower 4";

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

      setCopyText(
        [
          "Hi Hiraya Suites! I recently sent an inquiry through your website and would like to follow up.",
          "",
          `Inquiry reference: ${result.reference}`,
          `Name: ${submittedName}`,
          `Email: ${submittedEmail}`,
          `Phone: ${submittedPhone || "Not provided"}`,
          `Suite: ${result.suite || unit.shortName}`,
          `Check-in: ${
            hasDates
              ? formatDate(range.start)
              : "Not selected"
          }`,
          `Check-out: ${
            hasDates
              ? formatDate(range.end, true)
              : "Not selected"
          }`,
          `Guests: ${guests}`,
          `Estimated total: ${
            quote
              ? formatMoney(quote.total)
              : "Not available"
          }`,
          "",
          "I’d like to proceed with the booking. Please let me know the next steps. Thank you!",
        ].join("\n")
      );

      setCopied(false);
      setSuccessStep("confirmation");
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

  return (
    <Modal
      title={
        reference
          ? successStep === "payment"
            ? "Proceed with your downpayment."
            : "A lovely first step."
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
        successStep === "payment" ? (
          <div
            className="inquiry-payment"
            role="region"
            aria-label="Downpayment details"
          >
            <button
              type="button"
              className="inquiry-back-link"
              onClick={() =>
                setSuccessStep("confirmation")
              }
            >
              <ArrowLeft size={16} />
              Back to inquiry details
            </button>

            <div className="payment-intro">
              <div className="success-mark">
                <ShieldCheck size={28} />
              </div>

              <h3>Booking payment details</h3>

              <p>
                Your inquiry has been received. If
                you’re ready to proceed, please send
                the ₱
                {DOWNPAYMENT.toLocaleString("en-PH")}{" "}
                downpayment using the QR code below.
              </p>
            </div>

            {quote ? (
              <>
                <div className="payment-breakdown">
                  <div className="payment-breakdown-heading">
                    <span>
                      PAYMENT BREAKDOWN
                    </span>

                    <strong>
                      {unit.shortName}
                    </strong>
                  </div>

                  <div className="payment-row">
                    <span>
                      Estimated total
                    </span>

                    <strong>
                      {formatMoney(quote.total)}
                    </strong>
                  </div>

                  <div className="payment-row">
                    <span>Downpayment</span>

                    <strong>
                      ₱
                      {DOWNPAYMENT.toLocaleString(
                        "en-PH"
                      )}
                    </strong>
                  </div>

                  <div className="payment-row">
                    <span>
                      Remaining balance
                    </span>

                    <strong>
                      {formatMoney(balance)}
                    </strong>
                  </div>

                  <div className="payment-row payment-row-deposit">
                    <span>
                      Security deposit

                      <small>
                        Refundable upon checkout if
                        there are no stains or issues
                        in the unit.
                      </small>
                    </span>

                    <strong>
                      ₱
                      {SECURITY_DEPOSIT.toLocaleString(
                        "en-PH"
                      )}
                    </strong>
                  </div>

                  <div className="payment-row payment-row-total">
                    <span>
                      Total remaining balance
                    </span>

                    <strong>
                      {formatMoney(
                        totalRemaining
                      )}
                    </strong>
                  </div>
                </div>

                <div className="payment-qr-card">
                  <div>
                    <span className="payment-qr-label">
                      PAY VIA QR
                    </span>

                    <h4>
                      {qrLabel} payment QR
                    </h4>

                    <p>
                      Please make sure you use the
                      QR code for your selected
                      suite.
                    </p>
                  </div>

                  <div className="payment-qr-image-wrap">
                    <img
                      src={qrCode}
                      alt={`${qrLabel} payment QR code`}
                      className="payment-qr-image"
                    />
                  </div>

                  <p className="payment-reference-note">
                    After sending the payment,
                    please send your payment receipt
                    on Messenger together with your
                    inquiry reference{" "}
                    <strong>{reference}</strong>.
                  </p>
                </div>
              </>
            ) : (
              <div className="payment-warning">
                Your selected dates do not have an
                estimated total yet. Please message
                us on Messenger first so we can
                confirm the amount to pay.
              </div>
            )}

            <div className="payment-notes">
              <strong>Before you pay</strong>

              <ul>
                <li>
                  Parking fees are not included in
                  the estimated total.
                </li>

                <li>
                  The ₱500 security deposit is
                  refundable upon checkout if there
                  are no stains or issues in the
                  unit.
                </li>

                <li>
                  The booking is confirmed only
                  after payment and confirmation from
                  Hiraya Suites.
                </li>
              </ul>
            </div>

            <a
              className="button button-primary full-width inquiry-messenger-button"
              href="https://m.me/HirayaSuitesTagaytay"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />

              Send payment receipt on Messenger

              <ArrowUpRight size={18} />
            </a>

            <button
              type="button"
              className="button button-secondary full-width"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <div
            className="inquiry-success"
            role="status"
          >
            <div className="success-mark">
              <Check size={30} />
            </div>

            <h3>Your inquiry is in.</h3>

            <p>
              We’ve received your inquiry and saved
              a copy of your details. For faster
              communication, you can continue the
              conversation with us on Messenger.
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

            <div className="inquiry-messenger-note">
              <p>
                Tap{" "}
                <strong>
                  Copy inquiry details
                </strong>{" "}
                below, then open Messenger and paste
                the copied message into our chat. This
                helps us find your inquiry and reply
                more easily.
              </p>
            </div>

            <button
              type="button"
              className="button button-primary full-width"
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

            {quote && (
              <button
                type="button"
                className="button button-secondary full-width"
                onClick={() =>
                  setSuccessStep("payment")
                }
              >
                Proceed with your downpayment

                <ArrowUpRight size={18} />
              </button>
            )}

            {error && (
              <p
                className="form-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <p className="fine-print">
              This is an inquiry and not a confirmed
              reservation. No payment has been taken
              and your dates have not been reserved.
            </p>

            <button
              type="button"
              className="button button-primary full-width"
              onClick={onClose}
            >
              Back to your getaway{" "}
              <ArrowUpRight size={18} />
            </button>
          </div>
        )
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

                {quote.additionalGuests > 0 && (
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
                Send my inquiry{" "}
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
