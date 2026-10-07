"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clipboard,
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

export default function InquiryForm({
  unit,
  range,
  guests,
  onClose,
}: InquiryFormProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [suiteName, setSuiteName] = useState("");

  const [paymentScreen, setPaymentScreen] =
    useState(false);

  const [copied, setCopied] = useState(false);

  const [guestDetails, setGuestDetails] =
    useState({
      name: "",
      email: "",
      phone: "",
    });

  const hasDates = Boolean(range.start && range.end);

  const quote = hasDates
    ? getQuote(
        unit.id,
        range.start,
        range.end,
        guests
      )
    : null;

  const estimatedTotal = quote?.total ?? 0;

  const downpayment = 1000;

  const remainingBalance = Math.max(
    0,
    estimatedTotal - downpayment
  );

  const securityDeposit = 500;

  const totalRemaining =
    remainingBalance + securityDeposit;

  const messengerLink =
    "https://m.me/HirayaSuitesTagaytay";

  const inquiryMessage = `Hi Hiraya Suites! I’d like to proceed with my booking inquiry from your website.

Inquiry reference: ${reference}
Name: ${guestDetails.name}
Email: ${guestDetails.email}
Phone: ${guestDetails.phone || "Not provided"}
Suite: ${suiteName}
Check-in: ${
    hasDates
      ? formatDate(range.start)
      : "Not specified"
  }
Check-out: ${
    hasDates
      ? formatDate(range.end, true)
      : "Not specified"
  }
Guests: ${guests}
Estimated total: ${formatMoney(
    estimatedTotal
  )}

I’d like to proceed with the booking. Please let me know the next steps. Thank you!`;

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(
        inquiryMessage
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setError(
        "Unable to copy the inquiry. Please try again."
      );
    }
  }

  function continueToMessenger() {
    window.open(
      messengerLink,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (sending) return;

    setSending(true);
    setError("");

    const form = new FormData(
      event.currentTarget
    );

    const name =
      String(form.get("name") || "").trim();

    const email =
      String(form.get("email") || "").trim();

    const phone =
      String(form.get("phone") || "").trim();

    setGuestDetails({
      name,
      email,
      phone,
    });

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
            name,
            email,
            phone,
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

      setSuiteName(
        result.suite || unit.shortName
      );
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
        paymentScreen
          ? "Complete your booking"
          : reference
          ? "A lovely first step."
          : `Planning your stay in ${unit.shortName}.`
      }
      subtitle={
        paymentScreen
          ? "Here’s the payment breakdown for your stay."
          : reference
          ? undefined
          : "Tell us a little about yourself. Good stays begin with a hello."
      }
      onClose={onClose}
    >
      {paymentScreen ? (
        <div
          className="inquiry-success"
          role="region"
          aria-label="Payment details"
        >
          <button
            type="button"
            className="button button-secondary"
            onClick={() =>
              setPaymentScreen(false)
            }
            style={{
              marginBottom: "1.25rem",
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="success-mark">
            <Check size={30} />
          </div>

          <h3>
            Payment details
          </h3>

          <p>
            Your inquiry has been received.
            You can proceed with the
            ₱1,000 downpayment to move forward
            with your booking.
          </p>

          <div
            className="inquiry-reference"
            style={{
              marginTop: "1rem",
            }}
          >
            <span>
              YOUR INQUIRY REFERENCE
            </span>

            <strong>{reference}</strong>
          </div>

          <div
            className="payment-breakdown"
            style={{
              marginTop: "1.5rem",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.65rem 0",
              }}
            >
              <span>
                Estimated total
              </span>

              <strong>
                {formatMoney(
                  estimatedTotal
                )}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.65rem 0",
              }}
            >
              <span>
                Downpayment
              </span>

              <strong>
                {formatMoney(
                  downpayment
                )}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.65rem 0",
              }}
            >
              <span>
                Remaining balance
              </span>

              <strong>
                {formatMoney(
                  remainingBalance
                )}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.65rem 0",
              }}
            >
              <span>
                Refundable security deposit
              </span>

              <strong>
                {formatMoney(
                  securityDeposit
                )}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem 0",
                marginTop: "0.35rem",
                borderTop:
                  "1px solid rgba(0,0,0,0.12)",
                fontSize: "1.05rem",
              }}
            >
              <strong>
                Total remaining to settle
              </strong>

              <strong>
                {formatMoney(
                  totalRemaining
                )}
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "0.9rem 1rem",
              borderRadius: "12px",
              background:
                "rgba(0,0,0,0.035)",
              textAlign: "left",
            }}
          >
            <strong>
              Security deposit
            </strong>

            <p
              style={{
                margin:
                  "0.35rem 0 0",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              The ₱500 security deposit is
              refundable upon checkout as long
              as there are no stains, damages,
              missing items, or other issues
              with the unit.
            </p>
          </div>

          <div
            style={{
              marginTop: "0.9rem",
              padding: "0.9rem 1rem",
              borderRadius: "12px",
              background:
                "rgba(0,0,0,0.035)",
              textAlign: "left",
            }}
          >
            <strong>
              Parking is not included
            </strong>

            <p
              style={{
                margin:
                  "0.35rem 0 0",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              Parking fees, if needed, are
              separate from the amounts shown
              above.
            </p>
          </div>

          <div
            style={{
              marginTop: "1.5rem",
            }}
          >
            <h4
              style={{
                marginBottom:
                  "0.75rem",
              }}
            >
              Pay your downpayment
            </h4>

            <p
              style={{
                fontSize: "0.9rem",
                marginBottom:
                  "1rem",
              }}
            >
              Please scan the QR code below
              to pay the ₱1,000 downpayment
              for your selected suite.
            </p>

            <div
              style={{
                border:
                  "1px dashed rgba(0,0,0,0.25)",
                borderRadius: "14px",
                padding: "2rem 1rem",
                minHeight: "240px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background:
                  "rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <strong>
                  {unit.shortName} QR CODE
                </strong>

                <p
                  style={{
                    margin:
                      "0.5rem 0 0",
                    fontSize: "0.85rem",
                    opacity: 0.7,
                  }}
                >
                  QR code placeholder
                  <br />
                  Replace this with the
                  actual{" "}
                  {unit.shortName} payment
                  QR code.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="button button-primary full-width"
              onClick={copyInquiry}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Inquiry copied!
                </>
              ) : (
                <>
                  <Clipboard size={18} />
                  Copy inquiry for Messenger
                </>
              )}
            </button>

            <button
              type="button"
              className="button button-secondary full-width"
              onClick={continueToMessenger}
            >
              <MessageCircle size={18} />
              Continue on Messenger
              <ArrowUpRight size={18} />
            </button>
          </div>

          <p
            className="fine-print"
            style={{
              marginTop: "1rem",
            }}
          >
            After making your payment, please
            send your payment screenshot through
            Messenger together with your inquiry
            reference so we can verify and
            confirm your booking.
          </p>
        </div>
      ) : reference ? (
        <div
          className="inquiry-success"
          role="status"
        >
          <div className="success-mark">
            <Check size={30} />
          </div>

          <h3>
            Your inquiry is in.
          </h3>

          <p>
            We’ve received your inquiry and
            saved a copy of your details.
            For faster communication, you can
            continue the conversation with us
            on Messenger.
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
              {formatDate(
                range.end,
                true
              )}{" "}
              · {guests}{" "}
              {guests === 1
                ? "guest"
                : "guests"}{" "}
              · {unit.shortName}
            </p>
          )}

          {quote && (
            <div
              style={{
                margin:
                  "1.25rem 0",
                padding:
                  "1rem",
                borderRadius:
                  "12px",
                background:
                  "rgba(0,0,0,0.035)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "1rem",
                }}
              >
                <span>
                  Estimated total
                </span>

                <strong>
                  {formatMoney(
                    quote.total
                  )}
                </strong>
              </div>
            </div>
          )}

          <button
            type="button"
            className="button button-primary full-width"
            onClick={() =>
              setPaymentScreen(true)
            }
          >
            Proceed with your downpayment
            <ArrowUpRight size={18} />
          </button>

          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              className="button button-secondary full-width"
              onClick={copyInquiry}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Inquiry copied!
                </>
              ) : (
                <>
                  <Clipboard size={18} />
                  Copy inquiry for Messenger
                </>
              )}
            </button>

            <button
              type="button"
              className="button button-secondary full-width"
              onClick={continueToMessenger}
            >
              <MessageCircle size={18} />
              Continue on Messenger
              <ArrowUpRight size={18} />
            </button>
          </div>

          <p className="fine-print">
            This is an inquiry and not a
            confirmed reservation. Your booking
            will only be confirmed after payment
            verification and confirmation from
            Hiraya Suites.
          </p>

          <button
            type="button"
            className="button button-secondary full-width"
            onClick={onClose}
            style={{
              marginTop: "0.75rem",
            }}
          >
            Back to your getaway{" "}
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
                  {formatDate(
                    range.start
                  )}{" "}
                  –{" "}
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
                    ).replace(
                      "₱",
                      ""
                    )}{" "}
                    additional guest fee
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="inquiry-suite-note">
            <small>
              Selected suite:
            </small>

            <strong>
              {unit.name}
            </strong>
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
              I agree to have my contact
              details stored and used to
              respond to this inquiry.
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
            No payment required. Just the
            start of something lovely.
          </p>

          <p className="fine-print">
            Rates shown are based on your
            selected dates and number of guests.
            Inquiries do not reserve dates until
            confirmed by Hiraya Suites.
          </p>
        </form>
      )}
    </Modal>
  );
}
