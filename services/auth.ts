import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prismaClient";

// Secret keys taken from environment variables
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "";

// Token expiry times
const JWT_EXPIRE = "1h";
const REFRESH_TOKEN_EXPIRE = "1d";

/**
 * Service for handling authentication operations.
 */
export default class AuthService {
  /**
   * Login function
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Get login information
    const { nik, password } = req.body;

    try {
      // Check if the user exists and the password is correct
      const user = await prisma.user.findUnique({ where: { nik } });

      // If user not found
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      // Check for password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // If password is invalid
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: "Invalid password" });
        return;
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
      });

      // Generate Refresh Token
      const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRE,
      });

      // Set the refresh token in the cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "strict",
        secure: false, // ! Set this to true for production
      });

      // Return the generated tokens
      res.json({ success: true, token, refreshToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token function
   */
  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Get the refresh token from the request
      const refreshToken = req.cookies?.refreshToken;

      // If no refresh token is provided, return an error
      if (!refreshToken) {
        res.status(401).json({ error: "Refresh token required!" });
        return;
      }

      // Verify the refresh token
      const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

      // If the token is invalid, return an error
      if (!decoded || !decoded.userId) {
        res.status(403).json({ error: "Invalid refresh token" });
        return;
      }

      // Generate a new JWT token
      const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
      });

      // Generate a new refresh token
      const newRefreshToken = jwt.sign(
        { userId: decoded.userId },
        REFRESH_TOKEN_SECRET,
        {
          expiresIn: REFRESH_TOKEN_EXPIRE,
        },
      );

      // Set the new refresh token in the cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "strict",
        secure: false, // ! Set this to true for production
      });

      // Return the new tokens
      res.json({ success: true, token: newToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register function
   */
  static async signup(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Get registration information
      const { nik, password, ...userData } = req.body;

      // Check if the user already exists
      const existingUser = await prisma.user.findUnique({ where: { nik } });

      // If user already exists, return an error
      if (existingUser) {
        res.status(409).json({ success: false, error: "User already exists" });
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user in the database
      const newUser = await prisma.user.create({
        data: {
          nik,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: null,
          ...userData,
        },
      });

      res.status(201).json({ success: true, userId: newUser.id });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
}
