import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { ReadingTime, ReadingUnit } from "../src/generated/prisma/enums.js";

const DEMO_NAME = "Sweety Demo";
const DEMO_EMAIL = "demo@sweety.example";
const DEMO_PASSWORD = "Sweety-Demo-Only-2026!";
const PASSWORD_SALT_ROUNDS = 10;
const DAILY_READING_LIMIT = 4;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const sampleReadings = [
  { daysBeforeCreation: 5, hour: 7, minute: 0, value: 96, unit: ReadingUnit.MG_DL, readingType: ReadingTime.Fasting },
  { daysBeforeCreation: 5, hour: 13, minute: 30, value: 132, unit: ReadingUnit.MG_DL, readingType: ReadingTime.AfterMeal },
  { daysBeforeCreation: 4, hour: 7, minute: 15, value: 5.2, unit: ReadingUnit.MMOL_L, readingType: ReadingTime.Fasting },
  { daysBeforeCreation: 4, hour: 11, minute: 45, value: 107, unit: ReadingUnit.MG_DL, readingType: ReadingTime.BeforeMeal },
  { daysBeforeCreation: 3, hour: 7, minute: 30, value: 99, unit: ReadingUnit.MG_DL, readingType: ReadingTime.Fasting },
  { daysBeforeCreation: 3, hour: 14, minute: 15, value: 6.8, unit: ReadingUnit.MMOL_L, readingType: ReadingTime.AfterMeal },
  { daysBeforeCreation: 3, hour: 19, minute: 15, value: 126, unit: ReadingUnit.MG_DL, readingType: ReadingTime.Dinner },
  { daysBeforeCreation: 2, hour: 7, minute: 20, value: 5.4, unit: ReadingUnit.MMOL_L, readingType: ReadingTime.Fasting },
  { daysBeforeCreation: 2, hour: 11, minute: 30, value: 104, unit: ReadingUnit.MG_DL, readingType: ReadingTime.BeforeMeal },
  { daysBeforeCreation: 1, hour: 7, minute: 10, value: 97, unit: ReadingUnit.MG_DL, readingType: ReadingTime.Fasting },
  { daysBeforeCreation: 1, hour: 19, minute: 0, value: 6.1, unit: ReadingUnit.MMOL_L, readingType: ReadingTime.Dinner },
] as const;

function getUtcDateBounds(recordedAt: Date) {
  const start = new Date(Date.UTC(
    recordedAt.getUTCFullYear(),
    recordedAt.getUTCMonth(),
    recordedAt.getUTCDate(),
  ));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
    date: start.toISOString().slice(0, 10),
  };
}

function getRecordedAt(userCreatedAt: Date, sample: (typeof sampleReadings)[number]) {
  const anchor = new Date(Date.UTC(
    userCreatedAt.getUTCFullYear(),
    userCreatedAt.getUTCMonth(),
    userCreatedAt.getUTCDate(),
  ));
  anchor.setUTCDate(anchor.getUTCDate() - sample.daysBeforeCreation);
  anchor.setUTCHours(sample.hour, sample.minute, 0, 0);
  return anchor;
}

async function createSampleIfMissing(
  userId: string,
  reading: (typeof sampleReadings)[number],
  recordedAt: Date,
): Promise<"created" | "existing" | "daily-limit"> {
  const day = getUtcDateBounds(recordedAt);
  const lockKey = `${userId}:${day.date}`;

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked
    `;

    const existingSlot = await transaction.glucoseReading.findFirst({
      where: {
        userId,
        readingType: reading.readingType,
        recordedAt: { gte: day.start, lt: day.end },
      },
      select: { id: true },
    });
    if (existingSlot) return "existing";

    const dailyCount = await transaction.glucoseReading.count({
      where: {
        userId,
        recordedAt: { gte: day.start, lt: day.end },
      },
    });
    if (dailyCount >= DAILY_READING_LIMIT) return "daily-limit";

    await transaction.glucoseReading.create({
      data: {
        userId,
        value: reading.value,
        unit: reading.unit,
        readingType: reading.readingType,
        recordedAt,
      },
      select: { id: true },
    });
    return "created";
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_SALT_ROUNDS);
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: passwordHash,
    },
    update: {},
    select: { id: true, createdAt: true },
  });

  let created = 0;
  let existing = 0;
  let skippedAtDailyLimit = 0;

  for (const reading of sampleReadings) {
    const recordedAt = getRecordedAt(demoUser.createdAt, reading);
    const result = await createSampleIfMissing(demoUser.id, reading, recordedAt);
    if (result === "created") created += 1;
    if (result === "existing") existing += 1;
    if (result === "daily-limit") skippedAtDailyLimit += 1;
  }

  console.log(`Demo user ready: ${DEMO_EMAIL}`);
  console.log(`Sample readings created: ${created}; existing slots skipped: ${existing}; skipped at daily limit: ${skippedAtDailyLimit}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
