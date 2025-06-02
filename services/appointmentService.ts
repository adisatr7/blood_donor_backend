import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

export default class AppointmentService {
  /**
   * Buat appointment (sesi kunjungan) baru
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data dari request body
      const {
        locationId,
        status = "SCHEDULED",
        questionnaireSections = [],
      } = req.body;

      // Ambil ID user yang sedang login dari token JWT
      const userId = req.user!.id;

      // Gunakan transaksi jika agar ada error, seluruh proses pembuatan dibatalkan
      const result = await prisma.$transaction(async (trx) => {
        // Buat appointment baru di database
        const newAppointment = await trx.appointment.create({
          data: {
            locationId,
            userId,
            status,
          },
        });

        // Proses jawaban kuesioner
        if (Array.isArray(questionnaireSections) && questionnaireSections.length > 0) {
          // Susun data agar sesuai dengan format di tabel database
          const questionnaireData = questionnaireSections.flatMap(
            (section: any) =>
              (section.items || []).map((item: any) => ({
                appointmentId: newAppointment.id,
                number: item.itemNumber,
                question: item.question,
                answer: item.answer,
              }))
          );

          // Simpan data kuesioner ke database
          if (questionnaireData.length > 0) {
            await trx.questionnaire.createMany({
              data: questionnaireData,
            });
          }
        }
        return newAppointment;
      }); // <- Akhir dari transaksi

      // Jika transaksi berhasil, kirim response ke aplikasi mobile
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Ambil semua appointment milik user yang sedang login
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Ambil semua appointment milik user yang sedang login
      const appointments = await prisma.appointment.findMany({
        where: { userId },
        include: {
          Location: true,
        },
        orderBy: { Location: { startTime: "desc" } },
      });

      // Jika ada, kirimkan semua appointment sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Ambil appointment detail berdasarkan ID appointment
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login dan ID appointment dari parameter URL
      const userId = req.user!.id;
      const appointmentId = parseInt(req.params.id);

      // Ambil appointment berdasarkan ID appointment dan ID user
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, userId },
        include: {
          Questionnaire: true,
          Location: true,
        },
      });

      // Jika appointment tidak ditemukan, kirimkan response error 404
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Anda belum memiliki appointment",
        });
        return;
      }

      // Jika appointment ditemukan, kirimkan appointment sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Update appointment berdasarkan ID appointment
   * Untuk sekarang hanya bisa update status appointment
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login dan ID appointment dari parameter URL
      const userId = req.user!.id;
      const appointmentId = parseInt(req.params.id);

      // Pastikan status yang dimasukkan valid
      const validStatuses = ["SCHEDULED", "ATTENDED", "MISSED"];
      if (!validStatuses.includes(req.body.status)) {
        // Jika status tidak valid, kirimkan response error 400
        res.status(400).json({
          success: false,
          message: "Status appointment tidak valid. Pilih satu dari: " + validStatuses.join(", "),
        });
        return;
      }

      // Ubah data appointment sesuai request
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId, userId },
        data: { status: req.body.status },
      });

      // Jika berhasil, kirimkan appointment yang sudah di-update sebagai response
      res.status(200).json({
        success: true,
        data: updatedAppointment,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  // ? Method DELETE *sengaja tidak digunakan* karena appointment tidak seharusnya dapat dihapus
  // static async cancel(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     // Ambil ID user yang sedang login dan ID appointment dari parameter URL
  //     const userId = req.user!.id;
  //     const appointmentId = parseInt(req.params.id);

  //     // Hapus appointment berdasarkan ID appointment dan ID user
  //     await prisma.appointment.update({
  //       where: { id: appointmentId, userId },
  //       data: {
  //         status: "MISSED",
  //       },
  //     });

  //     // Kirimkan response sukses
  //     res.status(200).json({
  //       success: true,
  //       message: "Appointment berhasil dibatalkan",
  //     });
  //   } catch (error) {
  //     // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
  //     next(error);
  //   }
  // }
}
