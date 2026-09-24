import express from "express";

import {
    login,
    logout,
    updateUserPayment,
    deductCredits,
    refundCredits,
} from "../controllers/auth.controller.js";
import requireInternal from "../../../shared/middleware/requireInternal.js";

const router = express.Router();

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Update user plan after payment (billing service only)
router.post(
    "/update-plan",
    requireInternal,
    updateUserPayment
);

// Credits (agent service only)
router.post("/deduct-credits", requireInternal, deductCredits);
router.post("/refund-credits", requireInternal, refundCredits);

export default router;
