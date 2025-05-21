import express from "express";
import ProfileService from "../services/profileService";
import validateRequestBody from "../middlewares/validateRequestBody"

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/profile

// Request body yang dibutuhkan untuk ubah password
const passwordParams = ["oldPassword", "newPassword", "confirmNewPassword"];

router.get("/", ProfileService.get); // Ambil profil lengkap user yang sedang login
router.patch("/", ProfileService.update); // Update profil user yang sedang login
router.patch("/edit-password", validateRequestBody(passwordParams), ProfileService.editPassword); // Ubah password user yang sedang login

export default router;
