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
