import type { Request, Response } from "express";

export default class ReadinessService {
  /**
   * Check if the service is ready
   */
  static async isReady(req: Request, res: Response) {
    res.status(200).json({ success: true, status: "ready" });
  }
}
