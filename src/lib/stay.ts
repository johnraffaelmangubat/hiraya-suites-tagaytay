export type UnitId = "hiraya" | "mayumi";

export type Unit = {
  id: UnitId;
  name: string;
  shortName: string;
  eyebrow: string;
  tagline: string;
  description: string;
  size: string;
  beds: string;
  maxGuests: number;
  weekdayRate: number;
  weekendRate: number;
  additionalGuestFee: number;
  baseGuests: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  bestFor: string;
  vibe: string;
  highlights: string[];
  amenities: string[];
  heroImage: string;
  galleryTag: string;
};

export const UNITS: Unit[] = [
  {
    id: "hiraya",
    name: "SMDC Cool Suites Tower B",
    shortName: "Tower B",
    eyebrow: "GARDEN & CITY VIEW",
    tagline: "Roomy, sunlit, made for lingering.",
    description:
      "Our signature one-bedroom suite is the one for slow mornings and easy evenings — a proper bedroom with a queen bed, a full living area that converts to extra sleeping space, a private balcony, and room to unwind with a garden or city view.",
    size: "23.23 sqm",
    beds: "1 queen bed + double sofa bed",
    maxGuests: 4,
    weekdayRate: 1799,
    weekendRate: 1999,
    additionalGuestFee: 300,
    baseGuests: 2,
    minNights: 1,
    maxNights: 30,
    checkInTime: "5:00 PM",
    checkOutTime: "3:00 PM",
    bestFor:
      "Couples getaways, small families, friend groups of 3–4, and longer stays.",
    vibe: "Warm, roomy, and a little indulgent.",
    highlights: [
      "Private balcony",
      "Separate living area",
      "Queen bed + sofa bed for 2",
    ],
    amenities: [
      "Fast Wi-Fi",
      "Smart TV & Netflix",
      "Equipped kitchen",
      "Air conditioning",
      "Swimming pool access*",
      "Fresh linens & towels",
      "Coffee essentials",
      "Easy self check-in",
      "Hot shower & toiletries",
      "Refrigerator",
      "Dining essentials",
      "Laptop-friendly nook",
      "Hair dryer",
      "24/7 building security",
      "Private balcony",
    ],
    heroImage: "/images/living-room.jpg",
    galleryTag: "The signature suite",
  },
  {
    id: "mayumi",
    name: "SMDC Wind Residences Tower 4",
    shortName: "Tower 4",
    eyebrow: "CITY VIEW",
    tagline: "Compact, charming, quietly lovely.",
    description:
      "Soft, quiet studio for two — a thoughtful open-plan space with a plush double bed, a compact kitchenette, and all the little comforts you need for a sweet Tagaytay escape.",
    size: "26.62 sqm",
    beds: "1 Full Double Sized Bed and Pullout Bed",
    maxGuests: 4,
    weekdayRate: 1799,
    weekendRate: 1999,
    additionalGuestFee: 300,
    baseGuests: 2,
    minNights: 1,
    maxNights: 14,
    checkInTime: "4:00 PM",
    checkOutTime: "2:00 PM",
    bestFor:
      "Solo slow-downs, couples, and short, cozy escapes.",
    vibe: "Cozy, curated, and easy to love.",
    highlights: [
      "Full Double Sized Bed and Pullout Bed",
      "Bright open-plan layout",
      "Kitchenette for small bites",
    ],
    amenities: [
      "Fast Wi-Fi",
      "Smart TV & Netflix",
      "Kitchenette",
      "Air conditioning",
      "Swimming pool access*",
      "Fresh linens & towels",
      "Coffee essentials",
      "Easy self check-in",
      "Hot shower & toiletries",
      "Compact refrigerator",
      "Dining essentials",
      "Laptop-friendly spot",
      "Hair dryer",
      "24/7 building security",
    ],
    heroImage: "/images/mayumi-studio.jpg",
    galleryTag: "The cozy studio",
  },
];

export const DEFAULT_UNIT: UnitId = "hiraya";

export function getUnit(unitId: UnitId): Unit {
  return UNITS.find((u) => u.id === unitId) ?? UNITS[0];
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
}

export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(
  key: string,
  days: number
): string {
  const date = fromDateKey(key);

  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

export function isDateKey(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = fromDateKey(value);

  return (
    Number.isFinite(date.getTime()) &&
    toDateKey(date) === value
  );
}

export function getNights(
  checkIn: string,
  checkOut: string
): string[] {
  const nights: string[] = [];

  for (
    let date = checkIn;
    date < checkOut && nights.length <= 366;
    date = addDays(date, 1)
  ) {
    nights.push(date);
  }

  return nights;
}

export function getQuote(
  unitId: UnitId,
  checkIn: string,
  checkOut: string,
  guests: number
) {
  const unit = getUnit(unitId);
  const nights = getNights(checkIn, checkOut);

  const safeGuests = Math.max(
    1,
    Math.min(guests, unit.maxGuests)
  );

  const additionalGuests = Math.max(
    0,
    safeGuests - unit.baseGuests
  );

  const additionalGuestFeePerNight =
    additionalGuests * unit.additionalGuestFee;

  const subtotal = nights.reduce(
    (sum, night) => {
      const day = fromDateKey(night).getDay();

      const nightlyRate =
        day === 5 || day === 6
          ? unit.weekendRate
          : unit.weekdayRate;

      return sum + nightlyRate;
    },
    0
  );

  const additionalGuestTotal =
    additionalGuestFeePerNight * nights.length;

  const total =
    subtotal + additionalGuestTotal;

  return {
    unitId,
    nights: nights.length,
    guests: safeGuests,
    subtotal,
    additionalGuests,
    additionalGuestFeePerNight,
    additionalGuestTotal,
    total,
  };
}

export function formatMoney(
  amount: number
): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  key: string,
  long = false
): string {
  return fromDateKey(key).toLocaleDateString(
    "en-US",
    {
      month: long ? "long" : "short",
      day: "numeric",
      ...(long ? { year: "numeric" } : {}),
    }
  );
}
