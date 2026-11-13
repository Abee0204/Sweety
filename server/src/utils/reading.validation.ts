import { z } from "zod";
import { ReadingTime, ReadingUnit } from "../generated/prisma/enums.js";

export const createReadingSchema = z
  .object({
    value: z.number().finite().positive(),
    unit: z.enum(ReadingUnit),
    readingType: z.enum(ReadingTime),
    recordedAt: z
      .string()
      .datetime({ offset: true })
      .transform((recordedAt) => new Date(recordedAt)),
  })
  .superRefine(({ recordedAt }, context) => {
    if (recordedAt instanceof Date && recordedAt.getTime() > Date.now()) {
      context.addIssue({
        code: "custom",
        path: ["recordedAt"],
        message: "Reading timestamp cannot be in the future",
      });
    }
  });

export type CreateReadingInput = z.infer<typeof createReadingSchema>;

const utcCalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((date) => {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  }, "Date must be a valid calendar date")
  .transform((date) => new Date(`${date}T00:00:00.000Z`));

export const readingDateFiltersSchema = z
  .object({
    startDate: utcCalendarDateSchema.optional(),
    endDate: utcCalendarDateSchema.optional(),
  })
  .superRefine(({ startDate, endDate }, context) => {
    if (startDate && endDate && startDate > endDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate must be on or after startDate",
      });
    }
  });

export type ReadingDateFilters = z.infer<typeof readingDateFiltersSchema>;
