import type { Request, Response } from "express";

export default class ReadinessService {
  /**
   * Cek apakah server Backend sudah nyala
   */
  static async isReady(req: Request, res: Response) {
    // Jika server sudah nyala, kirimkan response dengan status 200 OK
    res.status(200).json({ success: true, status: "ready" });
  }
}
