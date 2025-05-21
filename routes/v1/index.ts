import express from "express";
import AppointmentController from "../../controllers/appointmentController";
import AuthController from "../../controllers/authController";
import HealthController from "../../controllers/healthController";
import LocationController from "../../controllers/locationController";
import ProfileController from "../../controllers/profileController";
import ReadinessController from "../../controllers/readinessController";
import protectedRoute from "../../middlewares/protectedRoute";

const router = express.Router(); // 🔎 https://localhost:3000/api/v1

router.use("/", ReadinessController); // Cek apakah server Backend menyala
router.use("/health-check", HealthController); // Cek apakah Backend terhubung ke Database
router.use("/auth", AuthController); // Login dan daftar akun
router.use("/profile", protectedRoute, ProfileController); // Lihat dan ubah profil  (🔒 Wajib login dulu)
router.use("/locations", protectedRoute, LocationController); // Lihat dan ubah lokasi donor (🔒 Wajib login dulu)
router.use("/appointments", protectedRoute, AppointmentController); // Lihat, buat, dan ubah appointment (🔒 Wajib login dulu)

export default router;
