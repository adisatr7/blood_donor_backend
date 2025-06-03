import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AiService from "../services/aiService";

// Request body yang dibutuhkan untuk chat dengan AI
const chatParam = ["message"];

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/ai

router.post("/chat", validateRequestBody(chatParam), AiService.chat); // Chat dengan AI
router.delete("/chat", AiService.clear); // Chat dengan AI

export default router;
