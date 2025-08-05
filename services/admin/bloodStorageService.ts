import type { NextFunction, Request, Response } from "express";
import prisma from "../../prisma/prismaClient";

export default class BloodStorageService {
  /**
   * Ambil semua data penyimpanan darah
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data penyimpanan darah dari database
      const result = await prisma.bloodStorage.findMany({
        orderBy: { createdAt: "desc" },
      });

      // Kirim data penyimpanan darah sebagai response
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error); // Serahkan error ke middleware penanganan error
    }
  }

  /**
   * Atur data penyimpanan darah baru
   */
  static async set(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, rhesus, quantity } = req.body;

      // Validasi input
      if (type !== "A" && type !== "B" && type !== "AB" && type !== "O") {
        res
          .status(400)
          .json({
            success: false,
            message: "Mohon masukkan `A`, `B`, `AB`, atau `O`",
          });
        return;
      }

      if (rhesus !== "POSITIVE" && rhesus !== "NEGATIVE") {
        res
          .status(400)
          .json({
            success: false,
            message: "Mohon masukkan `POSITIVE` atau `NEGATIVE`",
          });
        return;
      }

      // Ubah data jika sudah ada
      const existingData = await prisma.bloodStorage.findFirst({
        where: { type, rhesus },
      });

      let result;
      if (existingData) {
        // Jika data sudah ada, update quantity
        result = await prisma.bloodStorage.update({
          where: { id: existingData.id },
          data: { quantity },
        });
      } else {
        result = await prisma.bloodStorage.create({
          data: {
            type,
            rhesus,
            quantity,
          },
        });
      }

      // Kirim response sukses
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error); // Serahkan error ke middleware penanganan error
    }
  }
}
