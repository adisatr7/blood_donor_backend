import type { NextFunction, Request, Response } from "express";

/**
 * Middleware to handle errors in the application.
 */
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err.stack);

  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      error: "Data not found",
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
}
