import express from "express";
import { moderateText } from "../controllers/moderationController.js";

const router = express.Router();

router.post("/moderate", moderateText);

export default router;