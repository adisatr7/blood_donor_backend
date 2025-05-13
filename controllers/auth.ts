import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AuthService from "../services/auth";

const router = express.Router();

// Required fields for login and registration
const loginParams = ["nik", "password"];
const registerParams = ["nik", "name", "password", "birthDate"];

router.post("/login", validateRequestBody(loginParams), AuthService.login);
router.post("/token/refresh", AuthService.refreshToken);
router.post(
  "/register",
  validateRequestBody(registerParams),
  AuthService.signup,
);

export default router;
