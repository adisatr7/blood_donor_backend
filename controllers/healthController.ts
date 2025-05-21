import express from "express";
import HealthService from "../services/healthService";

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/health-check

router.get("/", HealthService.healthCheck); // Cek apakah Backend terhubung ke Database

export default router;
