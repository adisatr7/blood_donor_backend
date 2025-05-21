import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import LocationService from "../services/locationService";

// Request body yang dibutuhkan untuk membuat location
const createParams = ["name", "latitude", "longitude", "startTime", "endTime"];

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/locations

router.get("/:id", LocationService.getById); // Ambil 1 lokasi detail berdasarkan id
router.patch("/:id", validateRequestBody(), LocationService.update); // Update lokasi berdasarkan id
router.delete("/:id", LocationService.delete); // Hapus lokasi berdasarkan id

router.post("/", validateRequestBody(createParams), LocationService.create); // Buat lokasi baru
router.get("/", LocationService.getAll); // Ambil semua lokasi donor yang ada di database

export default router;
