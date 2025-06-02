import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AppointmentService from "../services/appointmentService";

const createParams = ["locationId", "questionnaireSections"]; // Request body yang dibutuhkan untuk membuat appointment

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/appointments

router.get("/:id", AppointmentService.getById); // Ambil 1 appointment detail berdasarkan id
router.patch("/:id", validateRequestBody(), AppointmentService.update); // Update appointment berdasarkan id

router.post("/", validateRequestBody(createParams), AppointmentService.create); // Buat appointment baru
router.get("/", AppointmentService.getAll); // Ambil semua appointment milik user yang sedang login

export default router;
