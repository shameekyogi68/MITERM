import { z } from "zod";

// ── Ride Validation ──────────────────────────────────────────────────────────

const EXPENSE_TYPES = ["TOLL", "PARKING", "MAINTENANCE", "FASTAG", "OTHER"] as const;

export const createRideSchema = z
  .object({
    date: z.coerce.date().refine((d) => !isNaN(d.getTime()), {
      message: "Invalid date provided.",
    }),
    petrolPrice: z
      .number({ message: "Petrol price is required." })
      .positive({ message: "Petrol price must be greater than 0." })
      .max(500, { message: "Petrol price seems unreasonably high." })
      .safe(),
    attendees: z
      .array(z.string().min(1, { message: "Member name cannot be empty." }))
      .min(2, { message: "Minimum 2 members required for a ride." })
      .max(6, { message: "Maximum 6 members allowed." })
      .refine((arr) => arr.includes("Shameek"), {
        message: "Shameek must be present in every ride.",
      })
      .refine((arr) => new Set(arr).size === arr.length, {
        message: "Attendee list contains duplicates.",
      }),
    additionalExpenses: z
      .array(
        z.object({
          type: z.enum(EXPENSE_TYPES),
          amount: z
            .number()
            .min(0, { message: "Expense amount cannot be negative." })
            .max(100000, { message: "Expense amount too high." }),
          description: z.string().max(500).optional(),
        }),
      )
      .max(10, { message: "Maximum 10 additional expenses allowed." })
      .default([]),
    notes: z.string().max(1000, { message: "Notes cannot exceed 1000 characters." }).optional(),
  })
  .strict();

export type CreateRideInput = z.infer<typeof createRideSchema>;

// ── Payment Validation ───────────────────────────────────────────────────────

export const paymentSchema = z
  .object({
    rideId: z.string().min(1, { message: "Ride ID is required." }),
    memberName: z
      .string()
      .min(1, { message: "Member name is required." })
      .max(100, { message: "Member name too long." }),
  })
  .strict();

export type PaymentInput = z.infer<typeof paymentSchema>;

// ── Settings Validation ──────────────────────────────────────────────────────

export const settingKeySchema = z
  .string()
  .min(1, { message: "Setting key is required." })
  .max(100, { message: "Setting key too long." });

export const updateSettingSchema = z
  .object({
    key: settingKeySchema,
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  })
  .strict();

export const memberDistanceSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Member name is required." })
      .max(100, { message: "Member name too long." }),
    distance: z
      .number()
      .positive({ message: "Distance must be greater than 0." })
      .max(5000, { message: "Distance seems unreasonably high." })
      .safe(),
  })
  .strict();

export const petrolPriceSchema = z
  .object({
    price: z
      .number({ message: "Price is required." })
      .positive({ message: "Price must be greater than 0." })
      .max(500, { message: "Price seems unreasonably high." })
      .safe(),
  })
  .strict();

// ── Export Validation ────────────────────────────────────────────────────────

export const exportFormatSchema = z.enum(["json", "csv"], {
  error: "Export format must be 'json' or 'csv'.",
});

// ── Pagination Validation ────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});
