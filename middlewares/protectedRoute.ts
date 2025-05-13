import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "";
const JWT_EXPIRE = "1h";

/**
 * Middleware to protect routes by verifying JWT tokens.
 *
 * If the access token is expired, it attempts to verify the refresh token
 * and generate a new access token. If both tokens are invalid, it returns
 * a 403 Forbidden response.
 *
 * This middleware also checks the current user's ID attached to the request.
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
    // If the access token is expired, check for a valid refresh token
    if (error instanceof jwt.TokenExpiredError) {
      console.warn(
        "Access token expired. Attempting to verify refresh token...",
      );

      // Get the refresh token from cookies
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: "Unauthorized: Refresh token required",
        });
        return;
      }

      try {
        // Verify the refresh token
        const decodedRefresh = jwt.verify(
          refreshToken,
          REFRESH_TOKEN_SECRET,
        ) as {
          userId: number;
        };

        // Generate a new access token
        const newAccessToken = jwt.sign(
          { userId: decodedRefresh.userId },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRE },
        );

        // Attach the new access token to the response header
        res.setHeader("Authorization", `Bearer ${newAccessToken}`);

        // Attach the user ID to the request object
        req.user = { id: decodedRefresh.userId };

        // Proceed to the next middleware or route handler
        next();
      } catch (refreshError) {
        console.error("Refresh token verification failed:", refreshError);
        res
          .status(403)
          .json({ success: false, error: "Forbidden: Invalid refresh token" });
        return;
      }
    }

    // If the error is not related to token expiration, return a generic error
    console.error("JWT verification failed:", error);
    res.status(403).json({ success: false, error: "Forbidden: Invalid token" });
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
