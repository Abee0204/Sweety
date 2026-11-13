import type { Request, Response } from "express";
import { registerSchema } from "../utils/auth.validation.js";
import { registerUser } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const user = await registerUser(validation.data);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Email is already registered"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
