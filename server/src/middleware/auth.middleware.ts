import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.get("authorization");
  const tokenMatch = authorization?.match(/^Bearer\s+(\S+)$/i);
  const secret = process.env.JWT_SECRET;

  if (!tokenMatch || !secret) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(tokenMatch[1], secret);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.id !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.user = { id: decoded.id };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
