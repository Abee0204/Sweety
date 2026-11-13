import type { Request, Response } from "express";
import {
  getDailyReport,
  getMonthlyReport,
} from "../services/report.service.js";
import {
  dailyReportQuerySchema,
  monthlyReportQuerySchema,
} from "../utils/report.validation.js";

export const daily = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const validation = dailyReportQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const report = await getDailyReport(userId, validation.data);
    return res.status(200).json({
      success: true,
      message: "Daily report retrieved successfully",
      data: report,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const monthly = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const validation = monthlyReportQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const report = await getMonthlyReport(userId, validation.data);
    return res.status(200).json({
      success: true,
      message: "Monthly report retrieved successfully",
      data: report,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
