import express from "express"
import adminOnly from "../../middlewares/adminOnly"
import validateRequestBody from "../../middlewares/validateRequestBody"
import UserService from "../../services/admin/userService"
import upload from "../../middlewares/upload"

const router = express.Router();

router.post("/", upload.single("profilePicture"), adminOnly, validateRequestBody(), UserService.create); // Buat user baru
router.get("/", adminOnly, validateRequestBody(), UserService.getAll); // Ambil semua user
router.get("/:id", adminOnly, validateRequestBody(), UserService.getById); // Ambil user berdasarkan ID
router.patch("/:id", adminOnly, validateRequestBody(), UserService.updateById); // Update user berdasarkan ID
router.patch("/:id/update-profile-picture", upload.single("profilePicture"), adminOnly, UserService.uploadProfilePicture); // Update foto profil user berdasarkan ID

export default router;
