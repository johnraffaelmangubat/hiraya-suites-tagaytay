import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Car,
  ShieldCheck,
} from "lucide-react";

const DOWNPAYMENT = 1000;
const SECURITY_DEPOSIT = 500;

function formatMoney(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function cleanNumber(value: string | undefined) {
  if (!value) return 0;

  const number = Number(
    value.replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(number) ? number : 0;
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    reference?: string;
    name?: string;
    suite?: string;
    guests?: string;
    total?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
}) {
  const params = await searchParams;

  const reference =
    params.reference || "Your inquiry";

  const suite =
    params.suite || "Selected suite";

  const guests =
    params.guests || "0";

  const estimatedTotal =
    cleanNumber(params.total);

  const remainingBalance = Math.max(
    estimatedTotal - DOWNPAYMENT,
    0
  );

  const totalRemaining =
    remainingBalance + SECURITY_DEPOSIT;

  const isTower4 =
    suite.toLowerCase().includes("tower 4");

  const qrCode = isTower4
    ? "/images/tower4/qr t4.jpg"
    : "/images/towerb/qr tb.jpg";

  return (
    <main className="payment-page">
      <div className="payment-container">
        <Link
          href="/"
          className="payment-back"
        >
          <ArrowLeft size={17} />
          Back to Hiraya Suites
        </Link>

        <section className="payment-card">
          <div className="payment-header">
            <div className="payment-success-icon">
              <CheckCircle2 size={27} />
            </div>

            <p className="payment-eyebrow">
              BOOKING NEXT STEP
            </p>

            <h1>
              Proceed with your
              <br />
              downpayment
            </h1>

            <p className="payment-intro">
              Your inquiry has been received.
              Please review the payment breakdown
              below before sending your downpayment.
            </p>
          </div>

          <div className="payment-reference">
            <span>INQUIRY REFERENCE</span>
            <strong>{reference}</strong>
          </div>

          <div className="payment-stay-summary">
            <div>
              <span>Suite</span>
              <strong>{suite}</strong>
            </div>

            <div>
              <span>Guests</span>
              <strong>{guests}</strong>
            </div>

            {params.checkIn && (
              <div>
                <span>Check-in</span>
                <strong>{params.checkIn}</strong>
              </div>
            )}

            {params.checkOut && (
              <div>
                <span>Check-out</span>
                <strong>{params.checkOut}</strong>
              </div>
            )}
          </div>

          <div className="payment-breakdown">
            <div className="payment-section-heading">
              <div>
                <span>PAYMENT BREAKDOWN</span>
                <h2>Your booking amount</h2>
              </div>
            </div>

            <div className="payment-line">
              <span>Estimated stay</span>
              <strong>
                {formatMoney(estimatedTotal)}
              </strong>
            </div>

            <div className="payment-line payment-highlight">
              <div>
                <span>Downpayment</span>
                <small>
                  Pay now to proceed with your
                  booking
                </small>
              </div>

              <strong>
                {formatMoney(DOWNPAYMENT)}
              </strong>
            </div>

            <div className="payment-divider" />

            <div className="payment-line">
              <div>
                <span>Remaining room balance</span>
                <small>
                  Estimated total minus downpayment
                </small>
              </div>

              <strong>
                {formatMoney(remainingBalance)}
              </strong>
            </div>

            <div className="payment-line">
              <div>
                <span>
                  Refundable security deposit
                </span>

                <small>
                  ₱500 refundable upon checkout if
                  there are no stains, damages, or
                  other issues in the unit.
                </small>
              </div>

              <strong>
                {formatMoney(SECURITY_DEPOSIT)}
              </strong>
            </div>

            <div className="payment-total">
              <div>
                <span>
                  TOTAL REMAINING UPON CHECK-IN
                </span>

                <small>
                  Room balance + security deposit
                </small>
              </div>

              <strong>
                {formatMoney(totalRemaining)}
              </strong>
            </div>
          </div>

          <div className="payment-notice">
            <ShieldCheck size={20} />

            <div>
              <strong>
                About the security deposit
              </strong>

              <p>
                The ₱500 security deposit is
                refundable upon checkout provided
                there are no stains, damages,
                missing items, or other issues
                requiring a deduction.
              </p>
            </div>
          </div>

          <div className="parking-notice">
            <Car size={20} />

            <div>
              <strong>
                Parking is not included
              </strong>

              <p>
                Parking fees are separate from the
                accommodation payment shown above.
              </p>
            </div>
          </div>

          <div className="payment-qr-section">
            <p className="payment-eyebrow">
              SEND YOUR DOWNPAYMENT
            </p>

            <h2>
              Scan the QR code
            </h2>

            <p className="payment-qr-description">
              Please send exactly{" "}
              <strong>
                {formatMoney(DOWNPAYMENT)}
              </strong>{" "}
              as your downpayment.
            </p>

            <div className="payment-qr-wrapper">
              <img
                src={qrCode}
                alt={`${suite} payment QR code`}
              />
            </div>

            <div className="payment-qr-label">
              <span>PAYMENT FOR</span>
              <strong>{suite}</strong>
            </div>
          </div>

          <div className="payment-instructions">
            <h3>
              How to complete your downpayment
            </h3>

            <ol>
              <li>
                Send your ₱1,000 downpayment using
                the QR code above.
              </li>

              <li>
                Keep your payment receipt or screenshot after completing the payment.
              </li>

              <li>
                Send the proof of payment to Hiraya
                Suites through Messenger.
              </li>

              <li>
                Include your inquiry reference{" "}
                <strong>{reference}</strong> so we
                can match your payment to your
                inquiry.
              </li>
            </ol>
          </div>

          <a
            href="https://m.me/HirayaSuitesTagaytay"
            target="_blank"
            rel="noreferrer"
            className="button button-primary full-width payment-messenger-button"
          >
            I've made the downpayment
            <span>Send proof on Messenger</span>
          </a>

          <p className="payment-disclaimer">
            Your reservation is only considered
            confirmed once the payment has been
            received and acknowledged by Hiraya
            Suites. Availability may change until
            confirmation.
          </p>
        </section>
      </div>
    </main>
  );
}
