import prisma from "../config/database.js";
import { ReadingUnit } from "../generated/prisma/enums.js";
import type {
  DailyReportQuery,
  MonthlyReportQuery,
} from "../utils/report.validation.js";

type ReportReading = {
  value: number;
  unit: ReadingUnit;
  recordedAt: Date;
};

type UnitStatistics = {
  totalReadings: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
};

export type UnitStatisticsByUnit = Record<ReadingUnit, UnitStatistics>;

export const summarizeByUnit = (readings: readonly ReportReading[]) => {
  const totals: Record<ReadingUnit, number> = {
    [ReadingUnit.MG_DL]: 0,
    [ReadingUnit.MMOL_L]: 0,
  };
  const statistics: UnitStatisticsByUnit = {
    [ReadingUnit.MG_DL]: {
      totalReadings: 0,
      average: null,
      minimum: null,
      maximum: null,
    },
    [ReadingUnit.MMOL_L]: {
      totalReadings: 0,
      average: null,
      minimum: null,
      maximum: null,
    },
  };

  for (const reading of readings) {
    const unitStats = statistics[reading.unit];
    unitStats.totalReadings += 1;
    totals[reading.unit] += reading.value;
    unitStats.minimum =
      unitStats.minimum === null
        ? reading.value
        : Math.min(unitStats.minimum, reading.value);
    unitStats.maximum =
      unitStats.maximum === null
        ? reading.value
        : Math.max(unitStats.maximum, reading.value);
  }

  for (const unit of [ReadingUnit.MG_DL, ReadingUnit.MMOL_L]) {
    const unitStats = statistics[unit];
    if (unitStats.totalReadings > 0) {
      unitStats.average = totals[unit] / unitStats.totalReadings;
    }
  }

  return statistics;
};

export const groupReadingsByUtcDay = (readings: readonly ReportReading[]) => {
  const groupedByDay = new Map<string, ReportReading[]>();
  for (const reading of readings) {
    const date = reading.recordedAt.toISOString().slice(0, 10);
    const dayReadings = groupedByDay.get(date) ?? [];
    dayReadings.push(reading);
    groupedByDay.set(date, dayReadings);
  }
  return Array.from(groupedByDay, ([date, dayReadings]) => ({
    date,
    totalReadings: dayReadings.length,
    byUnit: summarizeByUnit(dayReadings),
  }));
};

const findReadings = (userId: string, start: Date, end: Date) =>
  prisma.glucoseReading.findMany({
    where: {
      userId,
      recordedAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { recordedAt: "asc" },
    select: {
      id: true,
      value: true,
      unit: true,
      readingType: true,
      recordedAt: true,
      createdAt: true,
    },
  });

export const getDailyReport = async (
  userId: string,
  query: DailyReportQuery,
) => {
  // Query ranges are UTC calendar days, matching the reading APIs.
  const start = new Date(`${query.date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const readings = await findReadings(userId, start, end);

  return {
    date: query.date,
    readings,
    summary: {
      totalReadings: readings.length,
      byUnit: summarizeByUnit(readings),
    },
  };
};

export const getMonthlyReport = async (
  userId: string,
  query: MonthlyReportQuery,
) => {
  const start = new Date(`${query.month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const readings = await findReadings(userId, start, end);
  const days = groupReadingsByUtcDay(readings);

  return {
    month: query.month,
    days,
    summary: {
      totalReadings: readings.length,
      byUnit: summarizeByUnit(readings),
    },
  };
};
