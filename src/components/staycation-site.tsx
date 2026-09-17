"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  CookingPot,
  DoorOpen,
  Grid2X2,
  Heart,
  House,
  Info,
  Leaf,
  LoaderCircle,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  ParkingCircle,
  Plus,
  Refrigerator,
  Scan,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sun,
  Tv,
  UsersRound,
  Utensils,
  Waves,
  Wifi,
  Wind,
  X,
} from "lucide-react";
import Calendar, {
  type DateRange,
} from "@/components/calendar";
import Modal from "@/components/modal";
import InquiryForm from "@/components/inquiry-form";
import {
  addDays,
  DEFAULT_UNIT,
  formatDate,
  formatMoney,
  getNights,
  getQuote,
  getUnit,
  UNITS,
  type Unit,
  type UnitId,
} from "@/lib/stay";

const navLinks = [
  { label: "The Suites", id: "suites" },
  { label: "Amenities", id: "amenities" },
  { label: "Gallery", id: "gallery" },
  { label: "Availability", id: "availability" },
  { label: "Location", id: "location" },
];

type GallerySuite = UnitId | "shared";
type GalleryFilter = "all" | GallerySuite;

type GalleryPhoto = {
  id: string;
  src: string;
  title: string;
  room: string;
  suite: GallerySuite;
  alt: string;
};

const photos: GalleryPhoto[] = [
  {
    id: "hiraya-living",
    src: "/images/living-room.jpg",
    title: "Your cozy living space",
    room: "Living area",
    suite: "hiraya",
    alt: "Warm, neutral living room with a soft beige sofa and thoughtfully styled furnishings",
  },
  {
    id: "hiraya-bedroom",
    src: "/images/bedroom.jpg",
    title: "Sleep in. You deserve it.",
    room: "Bedroom",
    suite: "hiraya",
    alt: "Inviting bedroom with crisp linens, a comfortable bed, and soft natural light",
  },
  {
    id: "hiraya-lounge",
    src: "/images/lounge.jpg",
    title: "Make yourself at home",
    room: "Lounge corner",
    suite: "hiraya",
    alt: "Cozy apartment lounge with a beige sofa, coffee table, and television",
  },
  {
    id: "hiraya-kitchen",
    src: "/images/kitchen.jpg",
    title: "Something good is brewing",
    room: "Kitchen & dining",
    suite: "hiraya",
    alt: "A contemporary kitchen and dining area with warm neutral cabinetry",
  },
  {
    id: "mayumi-studio",
    src: "/images/mayumi-studio.jpg",
    title: "A soft little sunlit nook",
    room: "Open-plan studio",
    suite: "mayumi",
    alt: "Cozy open-plan studio apartment with warm wood, neutral tones, and sunlight",
  },
  {
    id: "mayumi-bedroom",
    src: "/images/mayumi-bedroom.jpg",
    title: "Quiet nights for two",
    room: "Sleeping nook",
    suite: "mayumi",
    alt: "Contemporary light bedroom with a comfortable bed and soft natural light",
  },
  {
    id: "mayumi-living",
    src: "/images/mayumi-living.jpg",
    title: "Compact, but so considered",
    room: "Living & dining",
    suite: "mayumi",
    alt: "Bright open studio with dining table near the bed and a soft, modern layout",
  },
  {
    id: "mayumi-dining",
    src: "/images/mayumi-dining.jpg",
    title: "A little table for two",
    room: "Dining corner",
    suite: "mayumi",
    alt: "Modern dining corner with warm wood tones and contemporary styling",
  },
  {
    id: "shared-pool",
    src: "/images/pool.jpg",
    title: "A slower kind of afternoon",
    room: "Building pool",
    suite: "shared",
    alt: "An outdoor swimming pool surrounded by tropical palm trees",
  },
  {
    id: "shared-mornings",
    src: "/images/slow-mornings.jpg",
    title: "No alarms. No hurry.",
    room: "Slow mornings",
    suite: "shared",
    alt: "A cup of coffee beside an open book and a dried rose on soft linen",
  },
];

const galleryGroups: {
  id: GallerySuite;
  label: string;
  detail: string;
  blurb: string;
}[] = [
  {
    id: "hiraya",
    label: "SMDC Cool Suites Tower B",
    detail: "Signature one-bedroom",
    blurb: "Roomy, sunlit spaces made for lingering.",
  },
  {
    id: "mayumi",
    label: "SMDC Wind Residences Tower 4",
    detail: "Cozy studio for two",
    blurb: "Compact, charming, quietly lovely.",
  },
  {
    id: "shared",
    label: "Shared spaces",
    detail: "Pool & little joys",
    blurb: "The little extras both suites can enjoy.",
  },
];

const galleryFilters: {
  id: GalleryFilter;
  label: string;
  detail: string;
}[] = [
  {
    id: "all",
    label: "All photos",
    detail: "Both suites + shared spaces",
  },
  {
    id: "hiraya",
    label: "Tower B",
    detail: "GARDEN & CITY VIEW",
  },
  {
    id: "mayumi",
    label: "Tower 4",
    detail: "CITY VIEW",
  },
  {
    id: "shared",
    label: "Shared spaces",
    detail: "Pool & little joys",
  },
];

const GALLERY_PREVIEW_LIMIT = 3;

function suiteLabel(suite: GallerySuite): string {
  if (suite === "hiraya") return "Tower B";
  if (suite === "mayumi") return "Tower 4";
  return "Shared space";
}

function suiteShort(suite: GallerySuite): string {
  if (suite === "hiraya") return "Tower B";
  if (suite === "mayumi") return "Tower 4";
  return "Shared";
}

function photosForSuite(
  suite: GallerySuite
): GalleryPhoto[] {
  return photos.filter(
    (photo) => photo.suite === suite
  );
}

const propertyAmenities = [
  {
    icon: Wifi,
    name: "Fast Wi-Fi",
    detail: "Stay connected, or don’t.",
  },
  {
    icon: Tv,
    name: "Smart TV & Netflix",
    detail: "One more episode? Always.",
  },
  {
    icon: Snowflake,
    name: "Air conditioning",
    detail: "Just the right kind of cool.",
  },
  {
    icon: Waves,
    name: "Swimming pool",
    detail: "A refreshing change of pace.*",
  },
  {
    icon: DoorOpen,
    name: "Easy self check-in",
    detail: "Arrive, settle in, exhale.",
  },
  {
    icon: ShieldCheck,
    name: "24/7 building security",
    detail: "Feel at ease throughout your stay.",
  },
  {
    icon: Coffee,
    name: "Coffee essentials",
    detail: "Good mornings start here.",
  },
  {
    icon: ParkingCircle,
    name: "Paid parking nearby",
    detail: "Subject to availability and building rates.",
  },
];

const unitAmenityMap: Record<
  UnitId,
  {
    icon:
      | typeof BedDouble
      | typeof Bath
      | typeof CookingPot
      | typeof Utensils
      | typeof Refrigerator
      | typeof Wind
      | typeof Monitor;
    label: string;
  }[]
> = {
  hiraya: [
    {
      icon: BedDouble,
      label: "Queen bed + sofa bed",
    },
    {
      icon: Bath,
      label: "Private bathroom",
    },
    {
      icon: CookingPot,
      label: "Full kitchen",
    },
    {
      icon: Utensils,
      label: "Dining for four",
    },
    {
      icon: Refrigerator,
      label: "Full refrigerator",
    },
    {
      icon: Monitor,
      label: "Laptop nook",
    },
    {
      icon: Wind,
      label: "Hair dryer",
    },
    {
      icon: Sun,
      label: "Private balcony",
    },
  ],
  mayumi: [
    {
      icon: BedDouble,
      label: "Queen bed",
    },
    {
      icon: Bath,
      label: "Private bathroom",
    },
    {
      icon: CookingPot,
      label: "Compact kitchenette",
    },
    {
      icon: Utensils,
      label: "Dining essentials",
    },
    {
      icon: Refrigerator,
      label: "Mini refrigerator",
    },
    {
      icon: Monitor,
      label: "Laptop-friendly spot",
    },
    {
      icon: Wind,
      label: "Hair dryer",
    },
    {
      icon: Heart,
      label: "Thoughtful little touches",
    },
  ],
};

const faqs: {
  q: string;
  a: React.ReactNode;
}[] = [
  {
    q: "How much is the stay?",
    a: (
      <>
        <p>
          Rates vary depending on the{" "}
          <strong>
            date, number of guests, weekends, holidays, and availability
          </strong>
          .
        </p>

        <p>
          For the most accurate and updated rate, please check our Airbnb
          listings or message us directly.
        </p>

        <p>
          <strong>Additional fees:</strong>
        </p>

        <ul>
          <li>
            Pool: <strong>₱150/person/day</strong> — regular days
          </li>
          <li>
            Pool: <strong>₱300/person/day</strong> — holidays
          </li>
          <li>
            Basement Parking: <strong>₱400/night</strong>
          </li>
          <li>
            Commercial Parking: <strong>Free</strong> — overnight parking is
            not allowed
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "Where can I book?",
    a: (
      <>
        <p>
          You can book either of our units through Airbnb:
        </p>

        <p>
          <strong>Tower B — 9th Floor</strong>
          <br />
          Balcony • Garden &amp; City View
          <br />
          airbnb.com/h/hirayasuitestagaytay
        </p>

        <p>
          <strong>Tower 4 — 8th Floor</strong>
          <br />
          City View
          <br />
          airbnb.com/h/hirayasuitestagaytaytower4
        </p>

        <p>
          You may also message us directly for availability and rates.
        </p>
      </>
    ),
  },
  {
    q: "What are the check-in and check-out times?",
    a: (
      <>
        <p>
          <strong>Tower B</strong>
        </p>

        <ul>
          <li>
            Check-in: <strong>5:00 PM</strong>
          </li>
          <li>
            Check-out: <strong>3:00 PM</strong>
          </li>
        </ul>

        <p>
          <strong>Tower 4</strong>
        </p>

        <ul>
          <li>
            Check-in: <strong>4:00 PM</strong>
          </li>
          <li>
            Check-out: <strong>2:00 PM</strong>
          </li>
        </ul>

        <p>
          Both units offer <strong>self check-in and self check-out</strong>.
        </p>
      </>
    ),
  },
  {
    q: "Is parking available?",
    a: (
      <>
        <p>
          Yes. <strong>Basement parking is ₱400/night.</strong>
        </p>

        <p>
          Commercial parking is <strong>free</strong>, but overnight parking
          is not allowed.
        </p>
      </>
    ),
  },
  {
    q: "Is pool access included?",
    a: (
      <>
        <p>
          Pool access is <strong>not included</strong> in the room rate.
        </p>

        <ul>
          <li>
            <strong>₱150/person/day</strong> — regular days
          </li>
          <li>
            <strong>₱300/person/day</strong> — holidays
          </li>
        </ul>

        <p>
          Other condo amenities may also have applicable fees and are subject
          to building rules and availability.
        </p>
      </>
    ),
  },
  {
    q: "Can we cook?",
    a: (
      <>
        <p>
          Yes. <strong>Light cooking is allowed</strong> in both units.
        </p>

        <p>
          Basic kitchen appliances, dining wares, and utensils are provided.
        </p>
      </>
    ),
  },
  {
    q: "What is included in the room?",
    a: (
      <>
        <p>Both units include:</p>

        <ul>
          <li>55&quot; Smart TV with Netflix</li>
          <li>Unlimited Wi-Fi</li>
          <li>PS4 &amp; games</li>
          <li>Kitchen appliances</li>
          <li>Dining wares &amp; utensils</li>
          <li>Hot shower</li>
          <li>Toiletries &amp; bath towels</li>
          <li>Honesty Store</li>
        </ul>

        <p>
          Each unit also has additional features specific to its setup.
        </p>
      </>
    ),
  },
  {
    q: "What is the difference between the two units?",
    a: (
      <>
        <p>
          <strong>Tower B — 9th Floor</strong>
        </p>

        <ul>
          <li>Balcony with Garden &amp; City View</li>
          <li>Queen Bed + Queen Sofa Bed</li>
          <li>Speaker with Microphone</li>
          <li>PS4, Board Games &amp; Card Games</li>
        </ul>

        <p>
          <strong>Tower 4 — 8th Floor</strong>
        </p>

        <ul>
          <li>City View</li>
          <li>Full Double Bed</li>
          <li>PS4 + Karaoke</li>
          <li>Board &amp; Card Games</li>
          <li>Badminton &amp; Pickleball Equipment</li>
        </ul>
      </>
    ),
  },
  {
    q: "Can I request early check-in or late check-out?",
    a: (
      <>
        <p>
          Early check-in and late check-out may be accommodated depending on
          availability and the cleaning schedule.
        </p>

        <p>
          Please message us in advance so we can check.
        </p>
      </>
    ),
  },
  {
    q: "How can I inquire?",
    a: (
      <p>
        For availability, current rates, or other questions, feel free to{" "}
        <strong>send us a message directly</strong> or book through our Airbnb
        listings above.
      </p>
    ),
  },
  {
    q: "How many guests can stay in the unit?",
    a: (
      <p>
        Both units are designed to accommodate guests comfortably. The exact
        maximum number of guests may depend on the booking configuration, so
        please check the indicated guest capacity when making your reservation.
      </p>
    ),
  },
];

function BrandLogo({
  footer = false,
}: {
  footer?: boolean;
}) {
  return (
    <a
      className={
        footer
          ? "brand brand--footer"
          : "brand"
      }
      href="#home"
      aria-label="Hiraya Suites home"
    >
      <Image
        src="/images/hiraya-logo.svg"
        alt="Hiraya Suites"
        width={140}
        height={40}
        className="brand-logo-img"
      />
    </a>
  );
}

function EscapeSeal() {
  return (
    <div
      className="escape-seal"
      aria-label="Slow days, soft stays"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          <path
            id="seal-circle"
            d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"
          />
        </defs>

        <text>
          <textPath
            href="#seal-circle"
            textLength="220"
          >
            SLOW DAYS · SOFT STAYS ·{" "}
          </textPath>
        </text>
      </svg>

      <Sun
        size={30}
        strokeWidth={1.2}
      />
    </div>
  );
}

type AvailabilityData = {
  today: string;
  maxDate: string;
  units: {
    id: UnitId;
    name: string;
    shortName: string;
    blockedDates: string[];
  }[];
  isDemo: boolean;
};

export default function StaycationSite({
  initialToday,
}: {
  initialToday: string;
}) {
  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("");

  const [selectedUnit, setSelectedUnit] =
    useState<UnitId>(DEFAULT_UNIT);

  const [range, setRange] =
    useState<DateRange>({
      start: "",
      end: "",
    });

  const [guestsByUnit, setGuestsByUnit] =
    useState<Record<UnitId, number>>({
      hiraya: 2,
      mayumi: 2,
    });

  const [availability, setAvailability] =
    useState<AvailabilityData>({
      today: initialToday,
      maxDate: addDays(
        initialToday,
        365
      ),
      units: UNITS.map((u) => ({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
        blockedDates: [],
      })),
      isDemo: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [rangeError, setRangeError] =
    useState("");

  const [dateDialog, setDateDialog] =
    useState(false);

  const [inquiryOpen, setInquiryOpen] =
    useState(false);

  const [galleryFilter, setGalleryFilter] =
    useState<GalleryFilter>("all");

  const [galleryIndex, setGalleryIndex] =
    useState<number | null>(null);

  const [infoDialog, setInfoDialog] =
    useState<
      "privacy" | "credits" | null
    >(null);

  const unit = useMemo<Unit>(
    () => getUnit(selectedUnit),
    [selectedUnit]
  );

  const guests =
    guestsByUnit[selectedUnit];

  const setGuests = (
    value:
      | number
      | ((current: number) => number)
  ) =>
    setGuestsByUnit((current) => ({
      ...current,
      [selectedUnit]:
        typeof value === "function"
          ? (
              value as (
                n: number
              ) => number
            )(current[selectedUnit])
          : value,
    }));

  const blocked = useMemo(
    () =>
      new Set(
        availability.units.find(
          (u) =>
            u.id === selectedUnit
        )?.blockedDates ?? []
      ),
    [availability, selectedUnit]
  );

  const quote =
    range.start && range.end
      ? getQuote(
          selectedUnit,
          range.start,
          range.end,
          guests
        )
      : null;

  const filteredPhotos = useMemo(
    () =>
      galleryFilter === "all"
        ? photos
        : photos.filter(
            (photo) =>
              photo.suite === galleryFilter
          ),
    [galleryFilter]
  );

  const photoCounts = useMemo(
    () => ({
      all: photos.length,
      hiraya: photosForSuite("hiraya").length,
      mayumi: photosForSuite("mayumi").length,
      shared: photosForSuite("shared").length,
    }),
    []
  );

  const galleryCollections = useMemo(
    () =>
      galleryGroups.map((group) => {
        const groupPhotos =
          photosForSuite(group.id);

        return {
          ...group,
          photos: groupPhotos,
          preview: groupPhotos.slice(
            0,
            GALLERY_PREVIEW_LIMIT
          ),
          remaining: Math.max(
            0,
            groupPhotos.length -
              GALLERY_PREVIEW_LIMIT
          ),
        };
      }),
    []
  );

  const activeGalleryPhoto =
    galleryIndex === null
      ? null
      : filteredPhotos[galleryIndex] ?? null;

  const loadAvailability =
    useCallback(async () => {
      setLoading(true);
      setAvailabilityError("");

      try {
        const response = await fetch(
          "/api/availability",
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "We couldn’t load available dates."
          );
        }

        setAvailability(result);
      } catch (err) {
        setAvailabilityError(
          err instanceof Error
            ? err.message
            : "Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    const observer =
      new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveSection(
                entry.target.id
              );
            }
          }
        },
        {
          rootMargin:
            "-18% 0px -55% 0px",
        }
      );

    navLinks.forEach(({ id }) => {
      const element =
        document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    return () =>
      observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      galleryIndex === null ||
      filteredPhotos.length === 0
    ) {
      return;
    }

    const handleKey = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        setGalleryIndex(
          (current) =>
            current === null
              ? null
              : (current + 1) %
                filteredPhotos.length
        );
      }

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        setGalleryIndex(
          (current) =>
            current === null
              ? null
              : (current -
                  1 +
                  filteredPhotos.length) %
                filteredPhotos.length
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [
    galleryIndex,
    filteredPhotos.length,
  ]);

  useEffect(() => {
    if (galleryIndex === null) {
      return;
    }

    if (filteredPhotos.length === 0) {
      setGalleryIndex(null);
      return;
    }

    if (
      galleryIndex >=
      filteredPhotos.length
    ) {
      setGalleryIndex(0);
    }
  }, [
    filteredPhotos.length,
    galleryIndex,
  ]);

  useEffect(() => {
    setGuests((current) =>
      Math.min(
        current,
        unit.maxGuests
      )
    );
  }, [
    selectedUnit,
    unit.maxGuests,
  ]);

  function selectDate(date: string) {
    if (
      loading ||
      availabilityError ||
      date < availability.today ||
      date > availability.maxDate
    ) {
      return;
    }

    setRangeError("");

    if (
      !range.start ||
      range.end ||
      date <= range.start
    ) {
      if (blocked.has(date)) return;

      setRange({
        start: date,
        end: "",
      });

      return;
    }

    const nights = getNights(
      range.start,
      date
    );

    if (
      nights.length < unit.minNights ||
      nights.length > unit.maxNights
    ) {
      setRangeError(
        `${unit.shortName} accepts stays from ${unit.minNights} to ${unit.maxNights} nights. For longer stays, please send a general inquiry.`
      );

      return;
    }

    if (
      nights.some((night) =>
        blocked.has(night)
      )
    ) {
      setRangeError(
        `There’s a reserved night in that range for ${unit.shortName}. Choose an earlier check-out, switch suites, or clear your dates to start again.`
      );

      return;
    }

    setRange({
      start: range.start,
      end: date,
    });
  }

  function clearDates() {
    setRange({
      start: "",
      end: "",
    });

    setRangeError("");
  }

  function checkAvailability() {
    if (!quote) {
      setDateDialog(true);
    } else {
      document
        .getElementById(
          "availability"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }
  }

  function requestStay() {
    if (!quote) {
      setDateDialog(true);
    } else {
      setInquiryOpen(true);
    }
  }

  function selectUnit(next: UnitId) {
    setSelectedUnit(next);
    setRangeError("");

    if (
      range.start &&
      range.end
    ) {
      const nextBlocked =
        new Set(
          availability.units.find(
            (u) =>
              u.id === next
          )?.blockedDates ?? []
        );

      const nights = getNights(
        range.start,
        range.end
      );

      if (
        nights.some((night) =>
          nextBlocked.has(night)
        ) ||
        guestsByUnit[next] >
          getUnit(next).maxGuests
      ) {
        setRange({
          start: "",
          end: "",
        });
      }
    }
  }

  function openGallery(
    filter: GalleryFilter = "all",
    photoId?: string
  ) {
    const nextPhotos =
      filter === "all"
        ? photos
        : photos.filter(
            (photo) =>
              photo.suite === filter
          );

    const nextIndex = photoId
      ? Math.max(
          0,
          nextPhotos.findIndex(
            (photo) =>
              photo.id === photoId
          )
        )
      : 0;

    setGalleryFilter(filter);

    setGalleryIndex(
      nextIndex === -1 ? 0 : nextIndex
    );
  }

  function changeGalleryFilter(
    next: GalleryFilter
  ) {
    setGalleryFilter(next);

    if (galleryIndex !== null) {
      setGalleryIndex(0);
    }
  }

  const calendarProps = {
    unit,
    today: availability.today,
    maxDate: availability.maxDate,
    blocked,
    range,
    onSelect: selectDate,
    onClear: clearDates,
    loading:
      loading ||
      Boolean(availabilityError),
  };

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="site-header">
        <div className="header-inner wrap">
          <BrandLogo />

          <nav
            className="desktop-nav"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={
                  activeSection ===
                  link.id
                    ? "is-active"
                    : ""
                }
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <a
              href="#availability"
              className="button button-primary header-cta"
            >
              Plan your stay{" "}
              <ArrowUpRight size={17} />
            </a>

            <button
              type="button"
              className="icon-button mobile-menu-toggle"
              aria-label={
                mobileMenu
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={
                mobileMenu
              }
              aria-controls="mobile-navigation"
              onClick={() =>
                setMobileMenu(
                  !mobileMenu
                )
              }
            >
              {mobileMenu ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() =>
                  setMobileMenu(
                    false
                  )
                }
              >
                {link.label}
                <ArrowUpRight
                  size={16}
                />
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="main-content">
        <section
          className="hero wrap"
          id="home"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span /> TWO SUITES, ONE
              LITTLE HIDEAWAY
            </p>

            <h1 id="hero-title">
              Somewhere to
              <br />
              <em>slow down.</em>
            </h1>

            <p className="hero-description">
              Leave the everyday behind.
              Two thoughtfully curated
              suites in Tagaytay for slow
              mornings, cozy evenings, and
              moments that feel just like
              home.
            </p>

            <div className="hero-location">
              <MapPin
                size={15}
                strokeWidth={1.6}
              />

              <span>
                Tagaytay, Philippines
              </span>

              <span className="little-dot" />

              <span>
                Hiraya Suite SMDC Wind Residences
              </span>
            </div>

            <div className="hero-buttons">
              <a
                className="button button-primary"
                href="#availability"
              >
                Check availability{" "}
                <ArrowUpRight
                  size={18}
                />
              </a>

              <a
                className="text-link"
                href="#suites"
              >
                Meet the suites{" "}
                <ArrowRight size={17} />
              </a>
            </div>

            <div className="hero-signoff">
              <Leaf
                size={24}
                strokeWidth={1.3}
              />

              <span>
                A little comfort. A
                little calm.{" "}
                <strong>
                  All yours.
                </strong>
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <button
              type="button"
              className="hero-main-photo image-button"
              onClick={() =>
                openGallery(
                  "hiraya",
                  "hiraya-living"
                )
              }
              aria-label="Explore the Hiraya Suite photo gallery"
            >
              <Image
                src="/images/living-room.jpg"
                alt={photos[0].alt}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
              />

              <span className="hero-photo-caption">
                <span className="caption-icon">
                  <House
                    size={19}
                    strokeWidth={1.4}
                  />
                </span>

                <span>
                  <strong>
                    Your home, away
                    from home.
                  </strong>

                  <small>
                    THOUGHTFULLY
                    DESIGNED. SIMPLY
                    YOURS.
                  </small>
                </span>
              </span>

              <span className="photo-expand">
                <Grid2X2 size={17} />
              </span>
            </button>

            <EscapeSeal />

            <button
              type="button"
              className="hero-inset image-button"
              onClick={() =>
                openGallery(
                  "mayumi",
                  "mayumi-studio"
                )
              }
              aria-label="View the Mayumi Studio gallery"
            >
              <Image
                src="/images/mayumi-studio.jpg"
                alt={
                  photos.find(
                    (photo) =>
                      photo.id ===
                      "mayumi-studio"
                  )!.alt
                }
                fill
                sizes="250px"
              />

              <span>
                <BedDouble size={15} /> Two
                suites. Two little moods.
              </span>
            </button>

            <span className="hero-visual-note">
              stay a while, make a memory.
            </span>
          </div>
        </section>

        <div className="booking-wrap wrap">
          <div
            className="suite-picker"
            role="group"
            aria-label="Choose your suite"
          >
            <button
              type="button"
              className={`suite-pill ${
                selectedUnit === "hiraya"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                selectUnit("hiraya")
              }
              aria-pressed={
                selectedUnit ===
                "hiraya"
              }
            >
              <small>
                SIGNATURE
              </small>

              <strong>
                SMDC Cool Suites Tower B
              </strong>

              <span>
                Up to 4 ·{" "}
                {formatMoney(
                  UNITS.find(
                    (u) =>
                      u.id ===
                      "hiraya"
                  )?.weekdayRate ??
                    1799
                )}
                /night
              </span>
            </button>

            <button
              type="button"
              className={`suite-pill ${
                selectedUnit === "mayumi"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                selectUnit("mayumi")
              }
              aria-pressed={
                selectedUnit ===
                "mayumi"
              }
            >
              <small>
                COZY STUDIO
              </small>

              <strong>
                SMDC Wind Residences Tower 4
              </strong>

              <span>
                Up to 4 ·{" "}
                {formatMoney(
                  UNITS.find(
                    (u) =>
                      u.id ===
                      "mayumi"
                  )?.weekdayRate ??
                    1799
                )}
                /night
              </span>
            </button>
          </div>

          <div
            className="booking-bar"
            aria-label="Plan your stay"
          >
            <button
              type="button"
              className="booking-field booking-field--suite"
              onClick={() => {
                setDateDialog(true);

                setTimeout(
                  () =>
                    document
                      .getElementById(
                        "suites"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      }),
                  220
                );
              }}
            >
              <House
                size={23}
                strokeWidth={1.4}
              />

              <span>
                <span className="field-label">
                  YOUR SUITE
                </span>

                <strong>
                  {unit.shortName}
                </strong>
              </span>

              <ChevronDown size={15} />
            </button>

            <button
              type="button"
              className="booking-field"
              onClick={() =>
                setDateDialog(true)
              }
            >
              <CalendarDays
                size={23}
                strokeWidth={1.4}
              />

              <span>
                <span className="field-label">
                  CHECK-IN
                </span>

                <strong>
                  {range.start
                    ? formatDate(
                        range.start,
                        true
                      )
                    : "Add your date"}
                </strong>
              </span>

              <ChevronDown size={15} />
            </button>

            <button
              type="button"
              className="booking-field"
              onClick={() =>
                setDateDialog(true)
              }
            >
              <CalendarDays
                size={23}
                strokeWidth={1.4}
              />

              <span>
                <span className="field-label">
                  CHECK-OUT
                </span>

                <strong>
                  {range.end
                    ? formatDate(
                        range.end,
                        true
                      )
                    : "Add your date"}
                </strong>
              </span>

              <ChevronDown size={15} />
            </button>

            <label className="booking-field booking-guests">
              <UsersRound
                size={23}
                strokeWidth={1.4}
              />

              <span>
                <span className="field-label">
                  GUESTS
                </span>

                <select
                  aria-label="Number of guests"
                  value={guests}
                  onChange={(event) =>
                    setGuests(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                >
                  {Array.from(
                    {
                      length:
                        unit.maxGuests,
                    },
                    (_, index) =>
                      index + 1
                  ).map((n) => (
                    <option
                      value={n}
                      key={n}
                    >
                      {n}{" "}
                      {n === 1
                        ? "guest"
                        : "guests"}
                    </option>
                  ))}
                </select>
              </span>

              <ChevronDown size={15} />
            </label>
          </div>

          <div className="quick-facts">
            {[
              {
                icon: BedDouble,
                title: unit.beds,
                detail:
                  unit.size +
                  " · all yours",
              },
              {
                icon: UsersRound,
                title: `Up to ${unit.maxGuests} guests`,
                detail: unit.vibe,
              },
              {
                icon: Bath,
                title:
                  "1 private bathroom",
                detail:
                  "Fresh linens & toiletries",
              },
              {
                icon: Clock3,
                title: `${unit.checkInTime} / ${unit.checkOutTime}`,
                detail:
                  "Easy self check-in",
              },
            ].map(
              ({
                icon: Icon,
                title,
                detail,
              }) => (
                <div
                  className="quick-fact"
                  key={title}
                >
                  <Icon
                    size={26}
                    strokeWidth={1.35}
                  />

                  <div>
                    <strong>
                      {title}
                    </strong>

                    <span>
                      {detail}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="booking-action">
            <button
              type="button"
              className="button button-primary"
              onClick={
                checkAvailability
              }
            >
              Find my little escape{" "}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <section
          className="suites-section section wrap"
          id="suites"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                CHOOSE YOUR SUITE
              </p>

              <h2>
                Two little escapes.
                <br />
                <em>
                  Which one feels like
                  you?
                </em>
              </h2>
            </div>

            <span className="availability-tag">
              <span className="status-dot" />
              Live availability
              shown for both suites
            </span>
          </div>

          <div className="suite-cards">
            {UNITS.map((suite) => {
              const isSelected =
                suite.id ===
                selectedUnit;

              const blockedForSuite =
                new Set(
                  availability.units.find(
                    (u) =>
                      u.id ===
                      suite.id
                  )?.blockedDates ??
                    []
                );

              const nextAvailable =
                loading ||
                availabilityError
                  ? ""
                  : (() => {
                      let cursor =
                        availability.today;

                      while (
                        cursor <=
                        availability.maxDate
                      ) {
                        const checkoutDate =
                          addDays(
                            cursor,
                            suite.minNights
                          );

                        if (
                          checkoutDate >
                          availability.maxDate
                        ) {
                          break;
                        }

                        const requiredNights =
                          getNights(
                            cursor,
                            checkoutDate
                          );

                        const stayIsAvailable =
                          requiredNights.length >=
                            suite.minNights &&
                          requiredNights.length <=
                            suite.maxNights &&
                          requiredNights.every(
                            (night) =>
                              !blockedForSuite.has(
                                night
                              )
                          );

                        if (
                          stayIsAvailable
                        ) {
                          return cursor;
                        }

                        cursor =
                          addDays(
                            cursor,
                            1
                          );
                      }

                      return "";
                    })();

              return (
                <article
                  key={suite.id}
                  className={`suite-card ${
                    isSelected
                      ? "is-selected"
                      : ""
                  }`}
                >
                  <div className="suite-card-image">
                    <Image
                      src={
                        suite.heroImage
                      }
                      alt={`${suite.name} interior`}
                      fill
                      sizes="(max-width: 700px) 100vw, 480px"
                    />

                    <span className="suite-card-tag">
                      {suite.eyebrow}
                    </span>

                    {isSelected && (
                      <span className="suite-card-selected">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="suite-card-body">
                    <h3>
                      {suite.name}
                    </h3>

                    <p className="suite-card-tagline">
                      {suite.tagline}
                    </p>

                    <p className="suite-card-description">
                      {suite.description}
                    </p>

                    <ul className="suite-card-highlights">
                      {suite.highlights.map(
                        (
                          highlight
                        ) => (
                          <li
                            key={
                              highlight
                            }
                          >
                            <Check
                              size={14}
                            />{" "}
                            {highlight}
                          </li>
                        )
                      )}
                    </ul>

                    <div className="suite-card-specs">
                      <span>
                        <BedDouble
                          size={14}
                        />{" "}
                        {suite.beds}
                      </span>

                      <span>
                        <Scan
                          size={14}
                        />{" "}
                        {suite.size}
                      </span>

                      <span>
                        <UsersRound
                          size={14}
                        />{" "}
                        Up to{" "}
                        {
                          suite.maxGuests
                        }
                      </span>
                    </div>

                    <div className="suite-card-rates">
                      <div>
                        <strong>
                          {formatMoney(
                            suite.weekdayRate
                          )}
                        </strong>

                        <span>
                          Weeknight
                        </span>
                      </div>

                      <div>
                        <strong>
                          {formatMoney(
                            suite.weekendRate
                          )}
                        </strong>

                        <span>
                          Weekend
                        </span>
                      </div>

                      <div>
                        <strong>
                          {loading
                            ? "Loading…"
                            : availabilityError
                            ? "Unavailable"
                            : nextAvailable
                            ? formatDate(
                                nextAvailable
                              )
                            : "Soon!"}
                        </strong>

                        <span>
                          Next available
                        </span>
                      </div>
                    </div>

                    <div className="suite-card-amenities">
                      <p className="suite-card-amenities-label">
                        What you’ll love:
                      </p>

                      <div className="suite-card-amenities-grid">
                        {unitAmenityMap[
                          suite.id
                        ].map(
                          ({
                            icon: Icon,
                            label,
                          }) => (
                            <span
                              key={
                                label
                              }
                            >
                              <Icon
                                size={14}
                              />{" "}
                              {label}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`button ${
                        isSelected
                          ? "button-primary"
                          : "button-outline"
                      } full-width`}
                      onClick={() => {
                        selectUnit(
                          suite.id
                        );

                        document
                          .getElementById(
                            "availability"
                          )
                          ?.scrollIntoView({
                            behavior:
                              "smooth",
                          });
                      }}
                    >
                      {isSelected ? (
                        <>
                          Selected —
                          check dates{" "}
                          <ArrowRight
                            size={16}
                          />
                        </>
                      ) : (
                        <>
                          Choose{" "}
                          {
                            suite.shortName
                          }{" "}
                          <ArrowUpRight
                            size={16}
                          />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="amenities-section section"
          id="amenities"
        >
          <div className="wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  THE LITTLE THINGS,
                  TAKEN CARE OF
                </p>

                <h2>
                  All the comforts.
                  <br className="mobile-break" />{" "}
                  None of the rush.
                </h2>
              </div>
            </div>

            <div className="amenities-grid">
              {propertyAmenities.map(
                ({
                  icon: Icon,
                  name,
                  detail,
                }) => (
                  <div
                    className="amenity"
                    key={name}
                  >
                    <Icon
                      size={29}
                      strokeWidth={1.35}
                    />

                    <div>
                      <h3>
                        {name}
                      </h3>

                      <p>
                        {detail}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            <p className="amenity-footnote">
              *Pool access is subject
              to building schedules and
              any applicable building
              guest fees. In-suite
              amenities vary between
              suites and are listed in
              each suite card above.
            </p>
          </div>
        </section>

        <section
          className="gallery-section section wrap"
          id="gallery"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                A PEEK INTO YOUR NEXT PAUSE
              </p>

              <h2>
                Wish you were{" "}
                <em>here.</em>
              </h2>

              <p>
                Photos are grouped by suite, with a short preview on the page. Open any group to browse the full set without making the page endless.
              </p>
            </div>

            <button
              type="button"
              className="button button-outline"
              onClick={() =>
                openGallery("all")
              }
            >
              <Grid2X2 size={16} /> View all{" "}
              {photoCounts.all} photos
            </button>
          </div>

          <div
            className="gallery-collections"
            aria-label="Photo collections by suite"
          >
            {galleryCollections.map(
              (collection) => (
                <article
                  key={collection.id}
                  className={`gallery-collection suite-${collection.id}`}
                >
                  <div className="gallery-collection-header">
                    <div>
                      <span
                        className={`gallery-suite-badge suite-${collection.id}`}
                      >
                        {suiteShort(
                          collection.id
                        )}
                      </span>

                      <h3>
                        {collection.label}
                      </h3>

                      <p>
                        {collection.blurb}
                      </p>
                    </div>

                    <div className="gallery-collection-meta">
                      <strong>
                        {
                          collection.photos
                            .length
                        }
                      </strong>

                      <span>
                        {collection.photos
                          .length === 1
                          ? "photo"
                          : "photos"}
                      </span>
                    </div>
                  </div>

                  <div className="gallery-collection-grid">
                    {collection.preview.map(
                      (photo, index) => {
                        const isLastPreview =
                          index ===
                            collection
                              .preview
                              .length -
                              1 &&
                          collection.remaining >
                            0;

                        return (
                          <button
                            type="button"
                            className={`gallery-photo gallery-photo--preview suite-${photo.suite}${
                              isLastPreview
                                ? " has-more"
                                : ""
                            }`}
                            key={photo.id}
                            onClick={() =>
                              openGallery(
                                collection.id,
                                photo.id
                              )
                            }
                            aria-label={
                              isLastPreview
                                ? `View all ${collection.photos.length} ${collection.label} photos`
                                : `View ${suiteLabel(photo.suite)} · ${photo.room}`
                            }
                          >
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              fill
                              sizes="(max-width: 700px) 90vw, 360px"
                            />

                            <span
                              className={`gallery-suite-badge suite-${photo.suite}`}
                            >
                              {suiteShort(
                                photo.suite
                              )}
                            </span>

                            {isLastPreview ? (
                              <span className="gallery-more-overlay">
                                <Grid2X2
                                  size={18}
                                />

                                <strong>
                                  +
                                  {
                                    collection.remaining
                                  }{" "}
                                  more
                                </strong>

                                <small>
                                  View full{" "}
                                  {suiteShort(
                                    collection.id
                                  )}{" "}
                                  gallery
                                </small>
                              </span>
                            ) : (
                              <>
                                <span className="gallery-photo-arrow">
                                  <ArrowUpRight
                                    size={18}
                                  />
                                </span>

                                <span className="gallery-photo-label">
                                  <span>
                                    {String(
                                      index +
                                        1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>

                                  {photo.room}
                                </span>
                              </>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="gallery-collection-actions">
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() =>
                        openGallery(
                          collection.id
                        )
                      }
                    >
                      View all{" "}
                      {
                        collection.photos
                          .length
                      }{" "}
                      {suiteShort(
                        collection.id
                      )}{" "}
                      photos{" "}
                      <ArrowUpRight
                        size={16}
                      />
                    </button>

                    {collection.id !==
                      "shared" && (
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => {
                          selectUnit(
                            collection.id as UnitId
                          );

                          document
                            .getElementById(
                              "availability"
                            )
                            ?.scrollIntoView({
                              behavior:
                                "smooth",
                            });
                        }}
                      >
                        Check{" "}
                        {suiteShort(
                          collection.id
                        )}{" "}
                        dates{" "}
                        <ArrowRight
                          size={15}
                        />
                      </button>
                    )}
                  </div>
                </article>
              )
            )}
          </div>

          <p className="gallery-note">
            Page previews stay compact on purpose. Add as many photos as you like — guests open the full set in the lightbox, grouped by suite. Photography is illustrative.
          </p>
        </section>

        <section
          className="availability-section section"
          id="availability"
        >
          <div className="wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  MAKE TIME FOR A
                  LITTLE GETAWAY
                </p>

                <h2>
                  Good days start with{" "}
                  <em>a date.</em>
                </h2>

                <p>
                  Choose your suite, pick
                  your dates, and we’ll take
                  it from there.
                </p>
              </div>

              <span className="availability-tag">
                <span className="status-dot" />
                Showing{" "}
                {unit.shortName}{" "}
                availability
              </span>
            </div>

            <div className="availability-layout">
              <div className="calendar-panel">
                <div
                  className="suite-tabs"
                  role="tablist"
                  aria-label="Suite calendar"
                >
                  {UNITS.map(
                    (suite) => (
                      <button
                        key={suite.id}
                        role="tab"
                        aria-selected={
                          suite.id ===
                          selectedUnit
                        }
                        className={`suite-tab ${
                          suite.id ===
                          selectedUnit
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() =>
                          selectUnit(
                            suite.id
                          )
                        }
                      >
                        {
                          suite.shortName
                        }

                        <small>
                          {
                            suite.maxGuests
                          }{" "}
                          guests max
                        </small>
                      </button>
                    )
                  )}
                </div>

                {loading && (
                  <div
                    className="calendar-status"
                    role="status"
                  >
                    <LoaderCircle
                      size={15}
                      className="spin"
                    />{" "}
                    Finding your slow
                    days…
                  </div>
                )}

                {availabilityError && (
                  <div
                    className="calendar-error"
                    role="alert"
                  >
                    <p>
                      {
                        availabilityError
                      }
                    </p>

                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        void loadAvailability()
                      }
                    >
                      Try again{" "}
                      <ArrowRight
                        size={15}
                      />
                    </button>
                  </div>
                )}

                <Calendar
                  {...calendarProps}
                />

                {rangeError && (
                  <p
                    className="form-error range-error"
                    role="alert"
                  >
                    {rangeError}
                  </p>
                )}

                <p className="calendar-note">
                  <Info size={14} /> Select
                  a check-in date, then a
                  check-out date.{" "}
                  {unit.shortName} accepts{" "}
                  {unit.minNights}–
                  {unit.maxNights} nights
                  for up to{" "}
                  {unit.maxGuests} guests.
                </p>
              </div>

              <aside
                className="stay-summary"
                aria-label="Your stay estimate"
              >
                <p className="eyebrow">
                  {unit.eyebrow}
                </p>

                <h3 className="suite-summary-name">
                  {unit.name}
                </h3>

                <p className="suite-summary-tagline">
                  {unit.tagline}
                </p>

                <div className="nightly-rate">
                  <strong>
                    {formatMoney(
                      unit.weekdayRate
                    )}
                  </strong>

                  <span>
                    {" "}
                    / night from
                  </span>
                </div>

                <p className="rate-subtitle">
                  Weeknight starting
                  rate · Base rate covers
                  up to{" "}
                  {unit.baseGuests} guests
                </p>

                <div className="summary-dates">
                  <button
                    type="button"
                    onClick={() =>
                      setDateDialog(
                        true
                      )
                    }
                  >
                    <span>
                      CHECK-IN
                    </span>

                    <strong>
                      {range.start
                        ? formatDate(
                            range.start
                          )
                        : "Choose date"}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDateDialog(
                        true
                      )
                    }
                  >
                    <span>
                      CHECK-OUT
                    </span>

                    <strong>
                      {range.end
                        ? formatDate(
                            range.end
                          )
                        : "Choose date"}
                    </strong>
                  </button>
                </div>

                <label className="summary-guests">
                  <span>
                    <UsersRound
                      size={16}
                    />{" "}
                    Guests
                  </span>

                  <select
                    aria-label="Guests for your stay"
                    value={guests}
                    onChange={(event) =>
                      setGuests(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  >
                    {Array.from(
                      {
                        length:
                          unit.maxGuests,
                      },
                      (_, index) =>
                        index + 1
                    ).map((n) => (
                      <option
                        value={n}
                        key={n}
                      >
                        {n}{" "}
                        {n === 1
                          ? "guest"
                          : "guests"}
                      </option>
                    ))}
                  </select>
                </label>

                {quote ? (
                  <div
                    className="quote-details"
                    aria-live="polite"
                  >
                    <div>
                      <span>
                        {quote.nights}{" "}
                        {quote.nights ===
                        1
                          ? "night"
                          : "nights"}{" "}
                        in{" "}
                        {unit.shortName}
                      </span>

                      <span>
                        {formatMoney(
                          quote.subtotal
                        )}
                      </span>
                    </div>

                    {quote.additionalGuests >
                      0 && (
                      <div>
                        <span>
                          Additional guest
                          fee
                        </span>

                        <span>
                          {formatMoney(
                            quote.additionalGuestTotal
                          )}
                        </span>
                      </div>
                    )}

                    <div className="quote-total">
                      <strong>
                        Estimated total
                      </strong>

                      <strong>
                        {formatMoney(
                          quote.total
                        )}
                      </strong>
                    </div>

                    <p className="dates-available">
                      <Check
                        size={14}
                      />{" "}
                      Your selected dates
                      are available in{" "}
                      {unit.shortName}
                    </p>
                  </div>
                ) : (
                  <div className="sample-rate-details">
                    <div>
                      <span>
                        Weeknights
                        (Sun–Thu)
                      </span>

                      <span>
                        {formatMoney(
                          unit.weekdayRate
                        )}
                      </span>
                    </div>

                    <div>
                      <span>
                        Weekends
                        (Fri–Sat)
                      </span>

                      <span>
                        {formatMoney(
                          unit.weekendRate
                        )}
                      </span>
                    </div>

                    <div>
                      <span>
                        3rd & 4th guest
                      </span>

                      <span>
                        +{" "}
                        {formatMoney(
                          unit.additionalGuestFee
                        )}
                        /night
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="button button-primary full-width"
                  onClick={
                    requestStay
                  }
                  disabled={
                    loading ||
                    Boolean(
                      availabilityError
                    )
                  }
                >
                  {quote
                    ? `Inquire about ${unit.shortName}`
                    : "Choose your dates"}

                  <ArrowUpRight
                    size={18}
                  />
                </button>

                <p className="summary-reassurance">
                  <ShieldCheck
                    size={14}
                  />{" "}
                  No payment now. No
                  pressure, ever.
                </p>

                <p className="fine-print">
                  Optional pool passes,
                  parking, and a
                  refundable security
                  deposit are separate.
                  Dates are only reserved
                  after host confirmation.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section
          className="location-section section wrap"
          id="location"
        >
          <div className="location-copy">
            <p className="eyebrow">
              A CHANGE OF SCENERY
            </p>

            <h2>
              Close to everything.
              <br />
              <em>
                Far from the everyday.
              </em>
            </h2>

            <p>
              A little cool air, a good
              cup of coffee, and a slower
              view of life. Our Tagaytay
              suites put the area’s best
              bits within easy reach.
            </p>

            <div className="location-points">
              <div>
                <Coffee
                  size={22}
                  strokeWidth={1.4}
                />

                <span>
                  <strong>
                    Good coffee, great
                    company
                  </strong>

                  <small>
                    Local cafés & dining
                    spots nearby
                  </small>
                </span>
              </div>

              <div>
                <ShoppingBag
                  size={22}
                  strokeWidth={1.4}
                />

                <span>
                  <strong>
                    The essentials, close
                    by
                  </strong>

                  <small>
                    Shops, groceries &
                    everyday conveniences
                  </small>
                </span>
              </div>

              <div>
                <MapPin
                  size={22}
                  strokeWidth={1.4}
                />

                <span>
                  <strong>
                    A breath of fresh air
                  </strong>

                  <small>
                    Tagaytay’s views &
                    favorite attractions
                  </small>
                </span>
              </div>
            </div>

            <a
              className="button button-outline"
              href="https://www.google.com/maps/search/?api=1&query=Tagaytay%2C%20Philippines"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore the neighborhood{" "}
              <ArrowUpRight
                size={16}
              />
            </a>

            <p className="location-note">
              Aguinaldo Highway (aka Tagaytay-Nasugbu Highway), Barangay Maharlika West,
              <br />
              Tagaytay City, Cavite, 4120, Philippines
            </p>
          </div>

          <div className="location-photo">
            <Image
              src="/images/tagaytay.jpg"
              alt="Scenic view of Taal Volcano and lake surrounded by lush greenery in Tagaytay"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />

            <span className="location-photo-label">
              <MapPin size={17} />{" "}
              TAGAYTAY, PHILIPPINES
            </span>

            <div className="location-photo-caption">
              A little fresh air.
              <br />
              <em>
                A whole new feeling.
              </em>
            </div>
          </div>
        </section>

        <section className="good-to-know-section section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  A FEW THINGS BEFORE
                  YOU UNWIND
                </p>

                <h2>
                  Feel at home.{" "}
                  <em>
                    Know before you go.
                  </em>
                </h2>
              </div>
            </div>

            <div className="house-rules">
              <div>
                <Clock3
                  size={26}
                  strokeWidth={1.3}
                />

                <h3>
                  Your time to settle
                  in
                </h3>

                <p>
                  Hiraya check-in from{" "}
                  <strong>
                    5:00 PM
                  </strong>
                  <br />
                  Hiraya check-out by{" "}
                  <strong>
                    3:00 PM
                  </strong>
                  <br />
                  Mayumi check-in from{" "}
                  <strong>
                    4:00 PM
                  </strong>
                  <br />
                  Mayumi check-out by{" "}
                  <strong>
                    2:00 PM
                  </strong>
                </p>
              </div>

              <div>
                <Heart
                  size={26}
                  strokeWidth={1.3}
                />

                <h3>
                  A little care goes a
                  long way
                </h3>

                <p>
                  No smoking, pets, or
                  parties in either suite.
                  <br />
                  Quiet hours: 10:00 PM –
                  8:00 AM.
                </p>
              </div>

              <div>
                <CalendarCheck2
                  size={26}
                  strokeWidth={1.3}
                />

                <h3>
                  Plans change. We get
                  it.
                </h3>

                <p>
                  Cancellation terms are
                  confirmed by the host
                  before payment.
                  <br />
                  Inquiries do not reserve
                  dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="faq-section section wrap"
          id="faq"
        >
          <div className="faq-intro">
            <p className="eyebrow">
              GOOD QUESTIONS. SIMPLE
              ANSWERS.
            </p>

            <h2>
              A little more
              <br />
              <em>
                peace of mind.
              </em>
            </h2>

            <p>
              Wondering about something
              else?
              <br />
              We’re happy to help.
            </p>

            <button
              type="button"
              className="text-link"
              onClick={() =>
                setInquiryOpen(true)
              }
            >
              <MessageCircle
                size={17}
              />{" "}
              Ask your host{" "}
              <ArrowUpRight
                size={16}
              />
            </button>
          </div>

          <div className="faq-list">
            {faqs.map((faq) => (
              <details
                className="faq-item"
                key={faq.q}
              >
                <summary>
                  {faq.q}
                  <Plus size={18} />
                </summary>

                <div className="faq-answer">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="closing-section wrap">
          <div className="closing-copy">
            <p className="eyebrow">
              LESS PLANNING. MORE
              UNWINDING.
            </p>

            <h2>
              Your little escape is
              waiting.
            </h2>

            <p>
              Two suites. All that’s
              missing is you.
            </p>
          </div>

          <a
            className="button button-light"
            href="#availability"
          >
            Let’s make it happen{" "}
            <ArrowUpRight size={18} />
          </a>

          <Leaf
            className="closing-leaf"
            size={210}
            strokeWidth={0.45}
            aria-hidden="true"
          />
        </section>
      </main>

      <footer className="site-footer wrap">
        <div className="footer-main">
          <div className="footer-brand">
            <BrandLogo footer />

            <p>
              Your Little Pause
              <br />
              from the Everyday
            </p>

            <span className="footer-location">
              <MapPin size={13} />{" "}
              Tagaytay, Philippines
            </span>
          </div>

          <div className="footer-column">
            <h3>
              A little look around
            </h3>

            <a href="#suites">
              The suites
            </a>

            <a href="#amenities">
              The comforts
            </a>

            <a href="#gallery">
              The gallery
            </a>
          </div>

          <div className="footer-column">
            <h3>
              Make yourself at home
            </h3>

            <a href="#availability">
              Find your dates
            </a>

            <a href="#location">
              Our neighborhood
            </a>

            <a href="#faq">
              Good to know
            </a>
          </div>

          <div className="footer-column footer-contact">
            <h3>
              Good stays start with
              hello.
            </h3>

            <p>
              A question, a special
              request,
              <br />
              or a little help planning?
            </p>

            <button
              type="button"
              className="text-link"
              onClick={() =>
                setInquiryOpen(true)
              }
            >
              Say hello{" "}
              <ArrowUpRight
                size={16}
              />
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {initialToday.slice(0, 4)}{" "}
            Hiraya Suites. Made for slow
            days.
          </p>

          <div>
            <button
              type="button"
              onClick={() =>
                setInfoDialog(
                  "privacy"
                )
              }
            >
              Privacy
            </button>

            <span>·</span>

            <button
              type="button"
              onClick={() =>
                setInfoDialog(
                  "credits"
                )
              }
            >
              Photo credits
            </button>

            <a
              href="#home"
              aria-label="Back to top"
            >
              <ArrowDown
                size={16}
                className="back-top"
              />
            </a>
          </div>
        </div>

        <p className="preview-note">
          <Info size={12} /> Rates and
          availability shown on this
          website are connected to the
          current availability system.
        </p>
      </footer>

      {dateDialog && (
        <Modal
          title={`Make room for a little ${unit.shortName} getaway.`}
          subtitle="Choose your suite and your arrival / departure. Slow days are just ahead."
          onClose={() =>
            setDateDialog(false)
          }
          variant="wide"
        >
          <div className="date-dialog-content">
            <div
              className="suite-tabs suite-tabs--dialog"
              role="tablist"
              aria-label="Suite calendar in dialog"
            >
              {UNITS.map(
                (suite) => (
                  <button
                    key={suite.id}
                    role="tab"
                    aria-selected={
                      suite.id ===
                      selectedUnit
                    }
                    className={`suite-tab ${
                      suite.id ===
                      selectedUnit
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      selectUnit(
                        suite.id
                      )
                    }
                  >
                    {
                      suite.shortName
                    }

                    <small>
                      {
                        suite.maxGuests
                      }{" "}
                      guests max · from{" "}
                      {formatMoney(
                        suite.weekdayRate
                      )}
                    </small>
                  </button>
                )
              )}
            </div>

            {availabilityError && (
              <div
                className="calendar-error"
                role="alert"
              >
                <p>
                  {
                    availabilityError
                  }
                </p>

                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    void loadAvailability()
                  }
                >
                  Try again{" "}
                  <ArrowRight
                    size={16}
                  />
                </button>
              </div>
            )}

            {loading && (
              <p className="calendar-status">
                <LoaderCircle
                  size={15}
                  className="spin"
                />{" "}
                Loading available
                dates…
              </p>
            )}

            <Calendar
              {...calendarProps}
            />

            {rangeError && (
              <p
                className="form-error"
                role="alert"
              >
                {rangeError}
              </p>
            )}

            <div className="date-dialog-bottom">
              <div>
                {quote ? (
                  <>
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
                      {quote.nights ===
                      1
                        ? "night"
                        : "nights"}{" "}
                      ·{" "}
                      {guests}{" "}
                      {guests === 1
                        ? "guest"
                        : "guests"}{" "}
                      ·{" "}
                      {formatMoney(
                        quote.total
                      )}{" "}
                      estimated total
                    </span>
                  </>
                ) : (
                  <p>
                    {range.start
                      ? `One more date, and you’re on your way to ${unit.shortName}.`
                      : `A change of pace in ${unit.shortName} starts right here.`}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="button button-primary"
                disabled={
                  !quote ||
                  loading ||
                  Boolean(
                    availabilityError
                  )
                }
                onClick={() => {
                  setDateDialog(
                    false
                  );

                  document
                    .getElementById(
                      "availability"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });
                }}
              >
                Use these dates{" "}
                <ArrowRight
                  size={17}
                />
              </button>
            </div>

            <p className="fine-print">
              Selecting dates does not
              create a reservation.
              Switching suites may clear
              dates if they overlap a
              reserved night.
            </p>
          </div>
        </Modal>
      )}

      {inquiryOpen && (
        <InquiryForm
          unit={unit}
          range={range}
          guests={guests}
          onClose={() =>
            setInquiryOpen(false)
          }
        />
      )}

      {activeGalleryPhoto &&
        galleryIndex !== null && (
          <Modal
            title={
              activeGalleryPhoto.title
            }
            subtitle={`${String(
              galleryIndex + 1
            ).padStart(
              2,
              "0"
            )} / ${String(
              filteredPhotos.length
            ).padStart(
              2,
              "0"
            )} · ${suiteLabel(
              activeGalleryPhoto.suite
            )} · ${
              activeGalleryPhoto.room
            }`}
            onClose={() =>
              setGalleryIndex(
                null
              )
            }
            variant="gallery"
          >
            <div className="gallery-viewer">
              <div
                className="gallery-viewer-toolbar"
                role="tablist"
                aria-label="Lightbox suite filter"
              >
                {galleryFilters.map(
                  (filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      role="tab"
                      aria-selected={
                        galleryFilter ===
                        filter.id
                      }
                      className={`gallery-viewer-filter ${
                        galleryFilter ===
                        filter.id
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() =>
                        changeGalleryFilter(
                          filter.id
                        )
                      }
                    >
                      {filter.label}

                      <small>
                        {
                          photoCounts[
                            filter.id
                          ]
                        }
                      </small>
                    </button>
                  )
                )}
              </div>

              <div className="gallery-viewer-image">
                <Image
                  src={
                    activeGalleryPhoto.src
                  }
                  alt={
                    activeGalleryPhoto.alt
                  }
                  fill
                  sizes="(max-width: 700px) 95vw, 900px"
                  priority
                />

                <span
                  className={`gallery-suite-badge gallery-suite-badge--viewer suite-${activeGalleryPhoto.suite}`}
                >
                  {suiteLabel(
                    activeGalleryPhoto.suite
                  )}
                </span>

                <button
                  type="button"
                  className="gallery-nav gallery-prev"
                  onClick={() =>
                    setGalleryIndex(
                      (galleryIndex -
                        1 +
                        filteredPhotos.length) %
                        filteredPhotos.length
                    )
                  }
                  aria-label="Previous photo"
                >
                  <ChevronLeft
                    size={24}
                  />
                </button>

                <button
                  type="button"
                  className="gallery-nav gallery-next"
                  onClick={() =>
                    setGalleryIndex(
                      (galleryIndex + 1) %
                        filteredPhotos.length
                    )
                  }
                  aria-label="Next photo"
                >
                  <ChevronRight
                    size={24}
                  />
                </button>
              </div>

              <div className="gallery-viewer-meta">
                <div>
                  <strong>
                    {
                      activeGalleryPhoto.room
                    }
                  </strong>

                  <span>
                    {suiteLabel(
                      activeGalleryPhoto.suite
                    )}
                  </span>
                </div>

                {activeGalleryPhoto.suite !==
                  "shared" && (
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      selectUnit(
                        activeGalleryPhoto.suite as UnitId
                      );

                      setGalleryIndex(
                        null
                      );

                      document
                        .getElementById(
                          "availability"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        });
                    }}
                  >
                    Check{" "}
                    {suiteShort(
                      activeGalleryPhoto.suite
                    )}{" "}
                    dates{" "}
                    <ArrowRight
                      size={16}
                    />
                  </button>
                )}
              </div>

              <div
                className={`gallery-thumbnails gallery-thumbnails--${Math.min(
                  filteredPhotos.length,
                  8
                )}`}
              >
                {filteredPhotos.map(
                  (
                    photo,
                    index
                  ) => (
                    <button
                      type="button"
                      key={photo.id}
                      className={
                        index ===
                        galleryIndex
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setGalleryIndex(
                          index
                        )
                      }
                      aria-label={`View ${suiteLabel(
                        photo.suite
                      )} · ${
                        photo.room
                      }`}
                      aria-pressed={
                        index ===
                        galleryIndex
                      }
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="100px"
                      />

                      <span
                        className={`gallery-thumb-badge suite-${photo.suite}`}
                      >
                        {suiteShort(
                          photo.suite
                        )}
                      </span>
                    </button>
                  )
                )}
              </div>

              <p className="fine-print">
                A little visual inspiration. These are placeholder photos, not images of the actual units. Each photo is tagged so you can tell Hiraya from Mayumi at a glance.
              </p>
            </div>
          </Modal>
        )}

      {infoDialog ===
        "privacy" && (
        <Modal
          title="Your details, thoughtfully handled."
          onClose={() =>
            setInfoDialog(null)
          }
        >
          <div className="policy-copy">
            <h3>
              What this website stores
            </h3>

            <p>
              When you send an inquiry,
              your chosen suite, name,
              email, optional phone
              number, message, guest
              count, and selected dates
              are saved in the
              application’s database.
            </p>

            <h3>
              Why we ask
            </h3>

            <p>
              These details are used to
              record and review your
              stay inquiry. No payment is
              taken through this inquiry
              form, and submitting an
              inquiry does not reserve
              dates.
            </p>

            <h3>
              You’re in control
            </h3>

            <p>
              Contact and data-retention
              policies should be finalized
              by the property owner before
              launch.
            </p>
          </div>
        </Modal>
      )}

      {infoDialog ===
        "credits" && (
        <Modal
          title="Beautiful spaces, talented people."
          subtitle="Our photography credits."
          onClose={() =>
            setInfoDialog(null)
          }
        >
          <div className="photo-credits">
            {[
              {
                name: "Thới Nam Cao",
                detail:
                  "Hiraya’s sunlit living space",
                url: "https://www.pexels.com/@thoinamcao",
              },
              {
                name: "Alan Antony",
                detail:
                  "Hiraya’s cozy lounge",
                url: "https://www.pexels.com/@alan-antony-279974862",
              },
              {
                name: "Max Vakhtbovych",
                detail:
                  "Bedroom, kitchen, and Mayumi Studio details",
                url: "https://www.pexels.com/@artbovich",
              },
              {
                name: "Relaxing Journeys",
                detail:
                  "Poolside moments",
                url: "https://www.pexels.com/@relaxing-journeys-500656459",
              },
              {
                name: "Feyza Daştan",
                detail:
                  "Slow morning inspiration",
                url: "https://www.pexels.com/@asumaani",
              },
              {
                name: "Justin Rieta",
                detail:
                  "A breath of Tagaytay air",
                url: "https://www.pexels.com/@justin-rieta-2153278648",
              },
            ].map(
              (credit) => (
                <a
                  href={credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={credit.name}
                >
                  <span>
                    <strong>
                      {
                        credit.name
                      }
                    </strong>

                    <small>
                      {
                        credit.detail
                      }
                    </small>
                  </span>

                  <ArrowUpRight
                    size={17}
                  />
                </a>
              )
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
