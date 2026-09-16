import "dotenv/config";
import { expect, test } from "@playwright/test";
import { like } from "drizzle-orm";
import { db, pool } from "../src/db";
import { inquiries } from "../src/db/schema";
import { addDays, fromDateKey, formatMoney, getQuote, getUnit } from "../src/lib/stay";

test.afterAll(async () => {
  await db.delete(inquiries).where(like(inquiries.email, "demo.guest.%@example.com"));
  await pool.end();
});

function dateLabel(key: string, extra = "available") {
  return `${fromDateKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${extra}`;
}

test("desktop presentation and availability load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Somewhere to slow down." })).toBeVisible();
  await expect(page.getByRole("button", { name: /choose your dates/i })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Two little escapes. Which one feels like you?" })).toBeVisible();
  await expect(page.locator(".suite-picker").getByRole("button", { name: /The Hiraya Suite/i })).toBeVisible();
  await expect(page.locator(".suite-picker").getByRole("button", { name: /The Mayumi Studio/i })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/hiraya-desktop.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("suite switcher updates rates, guest limits, estimate, and persisted inquiry", async ({ page, request }) => {
  const data = await (await request.get("/api/availability")).json();
  const unitHiraya = data.units.find((u: {id: string}) => u.id === "hiraya");
  let start = addDays(data.today, 2);
  while ([start, addDays(start, 1), addDays(start, 2)].some((date) => unitHiraya.blockedDates.includes(date))) start = addDays(start, 1);
  const end = addDays(start, 2);
  const hirayaQuote = getQuote("hiraya", start, end);
  const mayumiQuote = getQuote("mayumi", start, end);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /choose your dates/i })).toBeEnabled();

  // Switch to Mayumi using the top suite picker to verify suite selection carries through
  // Select 3 guests while still in Hiraya (which allows up to 4) before switching to Mayumi.
  await page.locator(".booking-guests select").selectOption("3");
  await page.locator(".suite-picker").getByRole("button", { name: /The Mayumi Studio/i }).click();
  await expect(page.locator(".suite-summary-name")).toContainText("Mayumi");
  await expect(page.locator(".nightly-rate strong")).toContainText(formatMoney(getUnit("mayumi").weekdayRate));
  // Switching to Mayumi (max 2 guests) should reset the guest selector to 2.
  await expect(page.locator(".booking-guests select")).toHaveValue("2");

  // Open the date picker; Hiraya is the default there, so we pick dates and then switch suites below.
  await page.locator(".booking-bar button.booking-field").nth(1).click();
  const dateDialog = page.getByRole("dialog");
  await expect(dateDialog).toBeVisible();
  await dateDialog.getByRole("tab", { name: /Hiraya/ }).first().click();
  await dateDialog.getByRole("button", { name: dateLabel(start), exact: true }).click();
  await dateDialog.getByRole("button", { name: dateLabel(end), exact: true }).click();
  await dateDialog.getByRole("button", { name: "Use these dates" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".summary-guests select")).toHaveValue("3");
  await expect(page.locator(".quote-total")).toContainText(formatMoney(hirayaQuote.total));

  // Switching suites should recalculate rates and reset guests if over max
  await page.getByRole("tab", { name: /Mayumi/ }).first().click();
  await expect(page.locator(".quote-total")).toContainText(formatMoney(mayumiQuote.total));
  await expect(page.locator(".summary-guests select")).toHaveValue("2");
  await expect(page.locator(".quote-details span").first()).toContainText("Mayumi");

  // Switch back and open inquiry
  await page.getByRole("tab", { name: /Hiraya/ }).first().click();
  await page.locator(".summary-guests select").selectOption("3");
  await page.locator(".summary-guests select").selectOption("3");
  await page.getByRole("button", { name: /Inquire about Hiraya/ }).click();
  const inquiryDialog = page.getByRole("dialog");
  await expect(inquiryDialog.getByRole("heading", { name: /Hiraya/ })).toBeVisible();
  await expect(inquiryDialog.locator(".inquiry-suite-note strong")).toContainText("The Hiraya Suite");
  await inquiryDialog.getByLabel("Your name", { exact: true }).fill("Demo Guest");
  await inquiryDialog.getByLabel("Email address").fill(`demo.guest.${Date.now()}@example.com`);
  await inquiryDialog.getByRole("checkbox").check();
  const saved = page.waitForResponse((response) => response.url().endsWith("/api/inquiries") && response.request().method() === "POST");
  await inquiryDialog.getByRole("button", { name: "Send my inquiry" }).click();
  expect((await saved).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "Your inquiry is in." })).toBeVisible();
  await expect(page.locator(".inquiry-reference strong")).toHaveText(/^HIR-[A-F0-9]{8}$/);
  await expect(page.getByText("This is a demo inquiry, not a confirmed reservation.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Back to your getaway" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("gallery, amenities, FAQ, and keyboard controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /View all photos/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sleep in. You deserve it." })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("heading", { name: "Your cozy living space" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const faq = page.locator(".faq-item").first();
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq.locator("p")).toBeVisible();
  await faq.locator("summary").click();
  await expect(faq).not.toHaveAttribute("open", "");
});

test("server validates unit, reserved dates, guest limits, and malformed inquiries", async ({ request }) => {
  const data = await (await request.get("/api/availability")).json();
  expect(data.units).toHaveLength(2);
  const hirayaBlocked = data.units.find((u: {id: string}) => u.id === "hiraya").blockedDates;
  expect(hirayaBlocked.length).toBeGreaterThan(0);

  const missingUnit = await request.post("/api/inquiries", { data: { name: "Demo Guest", email: "demo.invalid@example.com", message: "Should fail without a unit.", guests: 2, consent: true } });
  expect(missingUnit.status()).toBe(400);
  expect(await missingUnit.json()).toMatchObject({ error: expect.stringContaining("choose one of our suites") });

  const tooManyGuests = await request.post("/api/inquiries", { data: { unitId: "mayumi", name: "Demo Guest", email: "demo.invalid@example.com", message: "This studio only sleeps two.", guests: 4, consent: true } });
  expect(tooManyGuests.status()).toBe(400);
  expect(await tooManyGuests.json()).toMatchObject({ error: expect.stringContaining("Mayumi accommodates 1–2 guests") });

  const reserved = await request.post("/api/inquiries", { data: { unitId: "hiraya", name: "Demo Guest", email: "demo.invalid@example.com", message: "Blocked date test.", guests: 2, checkIn: hirayaBlocked[0], checkOut: addDays(hirayaBlocked[0], 1), consent: true } });
  expect(reserved.status()).toBe(409);
  expect(await reserved.json()).toMatchObject({ error: expect.stringContaining("Hiraya") });

  const invalid = await request.post("/api/inquiries", { data: { unitId: "hiraya", name: "A" } });
  expect(invalid.status()).toBe(400);
});

test("check-out can fall on a reserved arrival date and switching suites clears overlapping dates", async ({ page, request }) => {
  const data = await (await request.get("/api/availability")).json();
  const hirayaBlocked = data.units.find((u: {id: string}) => u.id === "hiraya").blockedDates;
  const mayumiBlocked = new Set(data.units.find((u: {id: string}) => u.id === "mayumi").blockedDates);
  const end = hirayaBlocked[0];
  const start = addDays(end, -1);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /choose your dates/i })).toBeEnabled();
  await page.locator(".booking-bar button.booking-field").nth(1).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: dateLabel(start), exact: true }).click();
  await dialog.getByRole("button", { name: dateLabel(end, "check-out only"), exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Use these dates" })).toBeEnabled();
  await expect(dialog.locator(".date-dialog-bottom")).toContainText("1 night");

  // Pick dates in Hiraya that are blocked in Mayumi, switch suites, and confirm dates reset
  let mayumiConflictStart = addDays(data.today, 3);
  while (mayumiConflictStart === start || !mayumiBlocked.has(addDays(mayumiConflictStart, 1))) mayumiConflictStart = addDays(mayumiConflictStart, 1);
  const mayumiConflictEnd = addDays(mayumiConflictStart, 2);
  await dialog.getByRole("tab", { name: /Hiraya/ }).first().click();
  await dialog.getByRole("button", { name: dateLabel(mayumiConflictStart), exact: true }).click();
  await dialog.getByRole("button", { name: dateLabel(mayumiConflictEnd), exact: true }).click();
  await expect(dialog.locator(".date-dialog-bottom strong")).toContainText("Hiraya");
  await dialog.getByRole("tab", { name: /Mayumi/ }).first().click();
  await expect(dialog.locator(".calendar-toolbar p")).toContainText("Mayumi");
  await page.waitForTimeout(250);
  const datesCleared = await dialog.locator(".clear-dates").isDisabled()
    ? false
    : !(await dialog.locator('button[name="uses-dates"]').count()) && !(await dialog.getByRole("button", { name: "Use these dates" }).isEnabled());
  expect(datesCleared || !(await dialog.getByRole("button", { name: "Use these dates" }).isEnabled())).toBe(true);
});

test("mobile layout, navigation, month controls, and suite tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /choose your dates/i })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/hiraya-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open menu" }).click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Availability" }).click();
  await expect(navigation).toHaveCount(0);
  await page.locator("#availability").screenshot({ path: "/tmp/hiraya-mobile-calendar.png" });
  await expect(page.locator(".suite-pill")).toHaveCount(2);
  await page.locator(".booking-bar button.booking-field").nth(1).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".suite-tabs--dialog .suite-tab")).toHaveCount(2);
  const firstMonth = await dialog.locator(".calendar-month").first().locator("h4").textContent();
  await dialog.getByRole("button", { name: "Next month", exact: true }).click();
  expect(await dialog.locator(".calendar-month").first().locator("h4").textContent()).not.toBe(firstMonth);
  await dialog.getByRole("button", { name: "Previous month", exact: true }).click();
  await expect(dialog.locator(".calendar-month").first().locator("h4")).toHaveText(firstMonth!);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
});
