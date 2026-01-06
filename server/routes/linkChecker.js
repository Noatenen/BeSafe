console.log("ROUTER FILE LOADED!!!!");
import express from "express";
import {checkLink} from "../controllers/linkCheckerController.js";
const router = express.Router();
router.post("/check", checkLink);
export default router;

console.log("LinkChecker router loaded");