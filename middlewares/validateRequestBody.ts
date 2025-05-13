import type { NextFunction, Request, Response } from "express";

/**
 * Middleware to ensure the request body is not empty and optionally validate required fields.
 * @param requiredFields - An array of required field names to validate (optional). If not provided,
 *                         only checks if the body is not empty.
 */
export default function validateRequestBody(
  requiredFields: string[] = [],
): any {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the request body exists and is not an empty object
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required and cannot be empty",
      });
    }

    // Validate required fields, if any
    const missingFields = requiredFields.filter(
      (field) => !(field in req.body),
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
}
