import type { NextFunction, Request, Response } from "express";

/**
 * Middleware yang memastikan request body tidak kosong dan secara opsional memvalidasi
 * field yang diperlukan.
 *
 * @param requiredFields - Array berisi nama field yang wajib divalidasi (opsional).
 *                         Jika tidak diberikan, hanya memeriksa apakah body
 *                         tidak kosong.
 */
export default function validateRequestBody(
  requiredFields: string[] = []
): any {
  return (req: Request, res: Response, next: NextFunction) => {
    // Pastikan request body tidak kosong
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body tidak boleh kosong",
      });
    }

    // Validasi field yang diperlukan (jika ada)
    const missingFields = requiredFields.filter(
      (field) => !(field in req.body)
    );

    // Jika ada field wajib yang kosong, kirimkan response error
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    next(); // Jika semua validasi lolos, lanjutkan ke middleware/route berikutnya
  };
}
