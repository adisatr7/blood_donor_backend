import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import prisma from "../../prisma/prismaClient"

export default class AdminService {
  static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil nama admin dari request body
      const { name } = req.body;

      // Buat secret key secara acak dan aman
      const secretKey = crypto.randomBytes(32).toString("hex");

      // Masukkan data admin baru ke database
      const result = await prisma.admin.create({
        data: {
          name,
          secretKey,
        },
      });

      res.status(201).json({
        success: true,
        secretKey: result.secretKey,
      });
    } catch (error) {
      next(error);
    }
  }
}
