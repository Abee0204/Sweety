import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../utils/auth.validation.js";
import { loginUser, registerUser } from "../services/auth.service.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

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

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await loginUser(validation.data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === INVALID_CREDENTIALS_MESSAGE
    ) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MESSAGE,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
