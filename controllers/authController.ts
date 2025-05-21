import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AuthService from "../services/authService";

// Request body yang dibutuhkan untuk login dan daftar akun
const loginParams = ["nik", "password"];
const signupParams = ["nik", "name", "password", "birthDate"];

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/auth

router.post("/login", validateRequestBody(loginParams), AuthService.login);
router.post("/signup", validateRequestBody(signupParams), AuthService.signup);

export default router;
