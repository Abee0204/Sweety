import type { Request, Response } from "express";
import {
  createReading,
  DailyReadingLimitError,
  DuplicateReadingSlotError,
  getReadings,
} from "../services/reading.service.js";
import {
  createReadingSchema,
  readingDateFiltersSchema,
} from "../utils/reading.validation.js";

export const create = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const validation = createReadingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const reading = await createReading(userId, validation.data);
    return res.status(201).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    if (error instanceof DuplicateReadingSlotError) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof DailyReadingLimitError) {
      return res.status(409).json({
        success: false,
        message: "Daily reading limit reached",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const list = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const validation = readingDateFiltersSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const readings = await getReadings(userId, validation.data);
    return res.status(200).json({
      success: true,
      message: "Readings retrieved successfully",
      data: readings,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
