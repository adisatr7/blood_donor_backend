import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AiService from "../services/aiService";

// Request body yang dibutuhkan untuk chat dengan AI
const chatParam = ["message"];

const router = express.Router(); // 🌐 http://localhost:3000/api/v1/ai

router.post("/chat", validateRequestBody(chatParam), AiService.sendChat); // Chat dengan AI
router.get("/chat", AiService.getChat); // Chat dengan AI
router.delete("/chat", AiService.clearChat); // Chat dengan AI

export default router;
