import {
  date,
  index,
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const blockedDates = pgTable(
  "blocked_dates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    unitId: varchar("unit_id", {
      length: 20,
    }).notNull(),

    date: date("date").notNull(),

    reason: varchar("reason", {
      length: 100,
    })
      .notNull()
      .default("Sample reservation"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("blocked_unit_date_idx").on(
      table.unitId,
      table.date
    ),
  ]
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    unitId: varchar("unit_id", {
      length: 20,
    }).notNull(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    email: varchar("email", {
      length: 254,
    }).notNull(),

    phone: varchar("phone", {
      length: 30,
    }),

    guests: integer("guests")
      .notNull()
      .default(2),

    checkIn: date("check_in"),

    checkOut: date("check_out"),

    message: text("message").notNull(),

    estimatedTotal: integer("estimated_total"),

    status: varchar("status", {
      length: 30,
    })
      .notNull()
      .default("pending"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inquiries_created_at_idx").on(
      table.createdAt
    ),

    index("inquiries_unit_idx").on(
      table.unitId
    ),
  ]
);
