import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

export default class HealthService {
  /**
   * Check if the service is ready
   */
  static async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.$queryRaw`SELECT id FROM users LIMIT 1`;
      res.status(200).json({ success: true, status: "healthy" });
    } catch (error) {
      next(error);
    }
  }
}
