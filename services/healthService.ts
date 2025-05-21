import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

export default class HealthService {
  /**
   * Cek apakah Backend sudah terhubung ke Database
   */
  static async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      // Cek koneksi ke database dengan menjalankan query sederhana
      await prisma.$queryRaw`SELECT id FROM users LIMIT 1`;

      // Jika berhasil, artinya koneksi ke database sudah terhubung
      // Kirimkan response dengan status 200 OK
      res.status(200).json({ success: true, status: "healthy" });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan status 500 Internal Server Error
      next(error);
    }
  }
}
