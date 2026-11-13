import { z } from "zod";

const utcDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((date) => {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  }, "Date must be a valid calendar date");

const utcMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must use YYYY-MM format")
  .refine((month) => {
    const monthNumber = Number(month.slice(5, 7));
    return monthNumber >= 1 && monthNumber <= 12;
  }, "Month must be a valid calendar month");

export const dailyReportQuerySchema = z.object({ date: utcDateSchema });
export const monthlyReportQuerySchema = z.object({ month: utcMonthSchema });

export type DailyReportQuery = z.infer<typeof dailyReportQuerySchema>;
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
