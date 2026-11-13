import prisma from "../config/database.js";
import type { CreateReadingInput } from "../utils/reading.validation.js";

const DAILY_READING_LIMIT = 4;

export class DailyReadingLimitError extends Error {
  constructor() {
    super("Daily reading limit reached");
    this.name = "DailyReadingLimitError";
  }
}

export const createReading = async (
  userId: string,
  reading: CreateReadingInput,
) => {
  // Readings are grouped by their recordedAt UTC calendar date.
  const year = reading.recordedAt.getUTCFullYear();
  const month = reading.recordedAt.getUTCMonth();
  const date = reading.recordedAt.getUTCDate();
  const dayStart = new Date(Date.UTC(year, month, date));
  const dayEnd = new Date(Date.UTC(year, month, date + 1));
  const lockKey = `${userId}:${dayStart.toISOString().slice(0, 10)}`;

  return prisma.$transaction(async (transaction) => {
    // The transaction-scoped advisory lock serializes each user's daily count-and-create.
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `;

    const count = await transaction.glucoseReading.count({
      where: {
        userId,
        recordedAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (count >= DAILY_READING_LIMIT) {
      throw new DailyReadingLimitError();
    }

    return transaction.glucoseReading.create({
      data: {
        userId,
        value: reading.value,
        unit: reading.unit,
        readingType: reading.readingType,
        recordedAt: reading.recordedAt,
      },
      select: {
        id: true,
        userId: true,
        value: true,
        unit: true,
        readingType: true,
        recordedAt: true,
        createdAt: true,
      },
    });
  });
};
