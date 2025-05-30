import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

/**
 * Middleware untuk melindungi route yang memerlukan login.
 * Jika token JWT tidak valid atau tidak ada, akses akan ditolak.
 */
export default function protectedRoute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Ambil token dari header request
    const authHeader = req.headers.authorization;

    // Jika token tidak ada, kirimkan response error `401 Unauthorized`
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, error: "Permintaan Ditolak: Anda tidak memiliki ijin akses" });
      return;
    }

    // Jika token ada, lakukan verifikasi
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Tempelkan ID user ke dalam request untuk memberikan ijin akses ke route yang memerlukan login
    req.user = { id: decoded.userId };

    // Lanjut ke middleware atau route berikutnya
    next();
  } catch (error) {
    // Jika token tidak valid atau sudah kadaluarsa, kirimkan response error `403 Forbidden`
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
