import type { NextFunction, Request, Response } from "express";

/**
 * Middleware untuk menangani error yang terjadi di server.
 */
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack); // Tampilkan error di console server

  // Kode error dari Prisma jika data tidak ditemukan
  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      error: "Data tidak ditemukan",
    });
    return;
  }

  // Jika error disebabkan oleh hal lain, kirimkan response dengan status apa adanya
  res.status(err.statusCode ?? 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
}
