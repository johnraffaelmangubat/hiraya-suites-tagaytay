# Hiraya Suites

A responsive, warm-neutral staycation website built with Next.js App Router, PostgreSQL, and Drizzle ORM.

## Included
- Two named suites — **The Hiraya Suite** (up to 4 guests, one-bedroom, private balcony) and **The Mayumi Studio** (up to 2 guests, cozy studio).
- Photo-led homepage with per-suite cards, shared property amenities, a seven-photo lightbox, area information, house rules, and expandable FAQs.
- Elegant suite switcher in the booking bar, availability section, and date-selection modal.
- Responsive availability calendar with per-unit reserved dates, range selection, guest selection, and itemized estimates.
- Server-validated booking and general inquiries saved to PostgreSQL, with unique reference numbers and the chosen suite.
- Keyboard-accessible native dialogs, mobile navigation, responsive layouts, reduced-motion support, and retry/error states.

## Customize the placeholders
- **Property name, nightly rates, cleaning fee, and stay limits:** `src/lib/stay.ts`.
- **Copy, amenities, photos, FAQs, location, and brand wordmark:** `src/components/staycation-site.tsx`.
- **Images:** `public/images/`. All existing property images are illustrative Pexels photography; credits are available in the footer.
- **Palette, typography styling, and layout:** `src/app/globals.css` and `src/app/layout.tsx`.
- **Browser icon:** `src/app/icon.svg`.

The typographic Hiraya wordmark and roof motif are inspired by the supplied branding; replace the `BrandLogo` component with the original logo asset when available.

## Data and API
The database connection is configured in `src/db/index.ts` using `DATABASE_URL`.

- `GET /api/availability` returns reserved dates, today's date in the Asia/Manila timezone, and the one-year booking horizon. It seeds illustrative reservations if no future blocked dates exist.
- `POST /api/inquiries` validates contact details, consent, stay length, rates, and date availability before saving a pending inquiry.
- `GET /api/health` checks application and database health.

Tables are defined in `src/db/schema.ts`:
- `blocked_dates`: dates unavailable for overnight stays.
- `inquiries`: private contact information, selected dates, estimated total, pending status, and timestamps. No public read endpoint exposes inquiries.

After the environment has been bootstrapped, apply the schema with `npx drizzle-kit push`.

## Preview behavior
All property details, rates, photos, and calendar reservations are explicitly marked as illustrative. Inquiries are persisted, but they do not reserve dates, charge a payment method, or send email. An inquiry success screen shows a reference number and explains these limits.

The sample rates are PHP 2,800 Sunday–Thursday and PHP 3,200 Friday–Saturday, plus a one-time PHP 500 cleaning fee. Optional pool passes, parking, and a refundable security deposit are not part of the estimate. Maximum occupancy is 4 guests and maximum inquiry stay length is 30 nights.

Before a real launch, replace the placeholder property and policy information; remove demo seeding in `src/lib/availability.ts`; connect an authenticated host workflow, real availability source, email delivery, and optional payments; and finalize your privacy and data-retention policies. Manage availability and pending inquiries through trusted server-side Drizzle operations, not a public unauthenticated administration endpoint.

## Validation
Run Next.js type generation, TypeScript checking, and the production build, then start the application through the platform-managed runtime. The project uses the supplied environment and existing npm scripts.
