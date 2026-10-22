import type { Metadata } from "next";
import ParkingCalendarClient from "./parking-calendar-client";

export const metadata: Metadata = {
  title: "Parking Availability | Hiraya Suites Tagaytay",
  description: "Check parking availability for Hiraya Suites Tagaytay.",
  robots: { index: false, follow: false },
};

export default function ParkingAvailabilityPage() {
  return <ParkingCalendarClient />;
}
