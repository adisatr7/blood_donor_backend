import { GoogleGenAI } from "@google/genai";
import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

/**
 * API key untuk Google GenAI. Pastikan Anda telah mengatur
 * AI_API_KEY di file `.env` Anda.
 */
const AI_API_KEY: string | undefined = process.env.AI_API_KEY;

/**
 * Model AI yang digunakan untuk chat
 */
const AI_MODEL: string = "gemini-2.0-flash";

/**
 * Service berisikan fungsi untuk berinteraksi dengan Google GenAI.
 */
export default class AiService {
  /**
   * Client untuk berinteraksi dengan Google GenAI.
   */
  private static client: GoogleGenAI | null = null;

  /**
   * Method untuk mengirim pesan ke AI dan mendapatkan balasan.
   * Endpoint ini digunakan untuk chat dengan AI.
   */
  static async sendChat(req: Request, res: Response, next: NextFunction) {
    try {
      // Pastikan client sudah terhubung sebelum melakukan chat
      AiService.client = await AiService.getClient();

      // Ambil ID dan pesan chat terbaru dari user
      const userId = req.user!.id;
      const { message: userMessage } = req.body;

      // Ambil data user agar AI lebih kenal lebih dekat dengan user
      const user = await prisma.user.findUnique({
        select: {
          name: true,
          birthDate: true,
          gender: true,
          weightKg: true,
          heightCm: true,
          bloodType: true,
          rhesus: true,
          address: true,
          village: true,
          district: true,
          city: true,
          province: true,
        },
        where: { id: userId },
      });

      // Cek riwayat chat sebelumnya milik user ini
      let rawHistory = await prisma.conversation.findFirst({
        where: { userId },
        include: {
          Messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Jika user belum ada riwayat chat, buatkan riwayat baru
      // untuk menyimpan pesan-pesan chat
      if (!rawHistory) {
        rawHistory = await prisma.conversation.create({
          data: { userId },
          include: { Messages: true },
        });
      }

      // Format data riwayat chat agar dapat diterima oleh Google GenAI
      const history = rawHistory?.Messages.map((msg) => ({
          role: msg.sender.toLowerCase(),
          parts: [{ text: msg.message }],
        })) || [];

      // Sisipkan riwayat chat sebelumnya
      const chat = AiService.client.chats.create({
        model: AI_MODEL,
        history: history,
      });

      // Kirim pesan baru ke AI dengan instruksi sistem yang sesuai
      const rawReply = await chat.sendMessage({
        message: userMessage,
        config: {
          systemInstruction:
            "You decide your female Indonesian name. You are a kind Indonesian red " +
            "cross worker aspiring to enlighten people about blood donation or " +
            "Palang Merah Indonesia in general. You are friendly, helpful, and " +
            "informative. Your responses should be in semi casual Indonesian. You " +
            "should preferably end by offering user to ask more questions or health " +
            `tips. User's name is ${user!.name}, a ${user!.gender} born in ` +
            `${user!.birthDate} (now is ${new Date().toISOString()}), weighs ` +
            `${user!.weightKg}kg at ${user!.heightCm}cm. Blood type is ` +
            `${user!.bloodType}${user!.rhesus} living in ${user!.address}, ` +
            `${user!.village}, ${user!.district}, ${user!.city}, ${user!.province}, ` +
            "Indonesia. Avoid using markdown and bold using ** but you can do numeric " +
            "list and bullet points via `-`. Always redirect topic to health if user " +
            "asks about other topics.",
        },
      });

      // Ambil pesan balasan dari AI dan hapus trailing newline jika ada
      let replyMessage = rawReply.candidates![0].content!.parts![0].text!;

      // Simpan pesan dari user dan balasan dari AI terbaru ke database
      await prisma.message.createMany({
        data: [
          // Pesan dari user
          {
            conversationId: rawHistory.id,
            sender: "USER",
            message: userMessage,
          },
          // Pesan balasan dari AI
          {
            conversationId: rawHistory.id,
            sender: "MODEL",
            message: replyMessage.trimEnd(), // Hapus '\n' bawaan response AI
          },
        ],
      });

      // Kirim seluruh isi riwayat chat ke user melalui response
      const data = await prisma.message.findMany({
        where: {
          conversationId: rawHistory.id,
          deletedAt: null,
        },
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getChat(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Ambil riwayat chat milik user ini
      const conversation = await prisma.conversation.findFirst({
        where: { userId },
        include: {
          Messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (!conversation || !conversation.Messages.length) {
        res.status(200).json({
          success: true,
          data: [],
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: conversation.Messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearChat(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      const conversation = await prisma.conversation.findFirst({
        select: { id: true },
        where: { userId },
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: "Riwayat chat tidak ditemukan.",
        });
        return;
      }

      // Hapus riwayat chat milik user ini
      await prisma.message.updateMany({
        data: { deletedAt: new Date() },
        where: {
          conversationId: conversation?.id,
          deletedAt: null,
        },
      });

      // Kirimkan response sukses
      res.status(200).json({
        success: true,
        message: "Riwayat chat berhasil dihapus.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Method internal untuk menghubungkan Backend ini ke layanan Google GenAI.
   */
  private static async getClient() {
    // Jika client sudah terhubung, gunakan client tersebut
    if (AiService.client) {
      return AiService.client;
    }

    // Jika belum terhubung dan API key tidak ada, lempar error
    if (!AI_API_KEY) {
      throw new Error("API key untuk AI tidak ditemukan.");
    }

    // Jika API key ada, buat instance GoogleGenAI client
    const aiClient = new GoogleGenAI({ apiKey: AI_API_KEY });
    AiService.client = aiClient;

    return aiClient;
  }
}
