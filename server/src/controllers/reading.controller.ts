import type { Request, Response } from "express";
import {
  createReading,
  DailyReadingLimitError,
} from "../services/reading.service.js";
import { createReadingSchema } from "../utils/reading.validation.js";

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
