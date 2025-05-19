import express from "express";
import ProfileService from "../services/profileService";

const router = express.Router();

router.get("/", ProfileService.get);
router.patch("/", ProfileService.update);
router.patch("/edit-password", ProfileService.editPassword);

export default router;
