import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prismaClient";

// Secret keys taken from environment variables
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRE = process.env.JWT_EXPIRE ?? "1h";

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
    next: NextFunction
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
        expiresIn: JWT_EXPIRE as any, // To supress TypeScript error
      });

      // Return the generated tokens
      res.json({ success: true, token });
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
    next: NextFunction
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
