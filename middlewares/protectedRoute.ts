import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

/**
 * Middleware to protect routes by verifying JWT tokens.
 * If the token is invalid or expired, returns 403 Unauthorized.
 */
export default function protectedRoute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    // Prevent unauthorized access if the token is not provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, error: "Unauthorized: No token provided" });
      return;
    }

    // Extract the access token
    const token = authHeader.split(" ")[1];

    // Verify the access token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Attach the user ID to the request object
    req.user = { id: decoded.userId };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "Forbidden: Invalid or expired token",
    });
  }
}

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}
