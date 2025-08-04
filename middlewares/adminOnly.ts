import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

/**
 * Middleware untuk melindungi route yang memerlukan login admin
 */
export default async function adminOnly(req: Request, res: Response, next: NextFunction) {
  try {
    const { secretKey } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { secretKey },
    })

    if (!admin) {
      throw new Error("Gagal: Admin tidak ditemukan atau secret key salah");
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "Gagal: Token tidak valid atau sudah kadaluarsa",
    });
  }
}

// Deklarasi tipe data untuk mencegah error/warning pada TypeScript (bisa diabaikan)
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}
