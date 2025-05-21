import express from "express";
import ReadinessService from "../services/readinessService";

const router = express.Router(); // 🌐 http://localhost:3000/api/v1

router.get("/", ReadinessService.isReady); // Cek apakah server Backend sudah nyala

export default router;
