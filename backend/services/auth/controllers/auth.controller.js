import crypto from "crypto";
import mongoose from "mongoose";
import { getAuth } from "firebase-admin/auth";

import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

// Production: the frontend (Vercel) and API (Render) are different sites,
// so the session cookie must be SameSite=None, which browsers only accept
// with Secure. Local dev over http stays Strict. COOKIE_SAMESITE overrides.
const isProduction = process.env.NODE_ENV === "production";
const sameSite =
    process.env.COOKIE_SAMESITE ||
    (isProduction ? "none" : "strict");

const cookieOptions = {
    httpOnly: true,
    secure: isProduction || sameSite === "none",
    sameSite,
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
    try {
        const { token } = req.body;

        // --------------------------------------
        // CHECK TOKEN
        // --------------------------------------

        if (!token) {
            return res.status(400).json({
                message: "Firebase token is required",
            });
        }

        // --------------------------------------
        // VERIFY FIREBASE TOKEN
        // --------------------------------------

        const decoded =
            await getAuth(app).verifyIdToken(token);

        // --------------------------------------
        // FIND USER
        // --------------------------------------

        let user = await User.findOne({
            firebaseUid: decoded.uid,
        });

        // --------------------------------------
        // CREATE USER IF NOT EXISTS
        // --------------------------------------

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,

                name: decoded.name || "",

                email: decoded.email || "",

                avatar: decoded.picture || "",

                plan: "free",

                credits: 100,

                totalCredits: 100,
            });
        }

        // --------------------------------------
        // CHECK OLD SESSION
        // --------------------------------------

        const oldSession = await redis.get(
            `user-session-${user._id}`
        );

        if (oldSession) {
            try {
                const parsed =
                    JSON.parse(oldSession);

                if (parsed.sessionId) {
                    await redis.del(
                        `session-${parsed.sessionId}`
                    );
                }
            } catch (error) {
                console.log(
                    "⚠️ OLD SESSION PARSE ERROR:",
                    error.message
                );
            }
        }

        // --------------------------------------
        // CREATE NEW SESSION
        // --------------------------------------

        const sessionId =
            crypto.randomUUID();

        // Same shape as GET /api/me, so the frontend sees one user object.
        const sessionUser = {
                userId:
                    user._id.toString(),

                name:
                    user.name,

                email:
                    user.email,

                avatar:
                    user.avatar,

                plan:
                    user.plan,

                credits:
                    user.credits,

                totalCredits:
                    user.totalCredits,

                planExpiresAt:
                    user.planExpiresAt,
            };

        // --------------------------------------
        // SAVE USER SESSION MAPPING
        // --------------------------------------

        await redis.set(
            `user-session-${user._id}`,
            JSON.stringify({
                sessionId: sessionId,
            }),
            "EX",
            7 * 24 * 60 * 60
        );

        // --------------------------------------
        // SAVE SESSION DATA
        // --------------------------------------

        await redis.set(
            `session-${sessionId}`,

            JSON.stringify(sessionUser),

            "EX",

            7 * 24 * 60 * 60
        );

        // --------------------------------------
        // SET COOKIE
        // --------------------------------------

        res.cookie(
            "session",
            sessionId,
            {
                ...cookieOptions,

                maxAge:
                    7 *
                    24 *
                    60 *
                    60 *
                    1000,
            }
        );

        // --------------------------------------
        // RESPONSE
        // --------------------------------------

        return res.status(200).json(sessionUser);

    } catch (error) {
        console.error(
            "❌ LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Login error: ${error.message}`,
        });
    }
};


// ==========================================
// LOGOUT
// ==========================================

export const logout = async (req, res) => {
    try {
        // --------------------------------------
        // GET SESSION FROM COOKIE
        // --------------------------------------

        const sessionId =
            req.cookies?.session;

        // --------------------------------------
        // DELETE SESSION
        // --------------------------------------

        if (sessionId) {
            const session = await redis.get(
                `session-${sessionId}`
            );

            await redis.del(
                `session-${sessionId}`
            );

            // drop the user -> session mapping too
            const userId = session
                ? JSON.parse(session).userId
                : null;

            if (userId) {
                await redis.del(
                    `user-session-${userId}`
                );
            }
        }

        // --------------------------------------
        // CLEAR COOKIE
        // --------------------------------------

        res.clearCookie(
            "session",
            cookieOptions
        );

        // --------------------------------------
        // RESPONSE
        // --------------------------------------

        return res.status(200).json({
            message:
                "Logout successfully",
        });

    } catch (error) {
        console.error(
            "❌ LOGOUT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Logout error: ${error.message}`,
        });
    }
};


// ==========================================
// UPDATE USER PAYMENT
// ==========================================

export const updateUserPayment =
    async (req, res) => {
        try {
            const {
                plan,
                credits,
                userId,
            } = req.body;

            console.log(
                "💳 UPDATE USER PAYMENT:",
                {
                    plan,
                    credits,
                    userId,
                }
            );

            // --------------------------------------
            // VALIDATE USER ID
            // --------------------------------------

            if (!userId) {
                return res.status(400).json({
                    message:
                        "User ID is missing",
                });
            }

            // --------------------------------------
            // VALIDATE PLAN
            // --------------------------------------

            if (!plan) {
                return res.status(400).json({
                    message:
                        "Plan is missing",
                });
            }

            // --------------------------------------
            // VALIDATE CREDITS
            // --------------------------------------

            if (
                credits === undefined ||
                credits === null
            ) {
                return res.status(400).json({
                    message:
                        "Credits are missing",
                });
            }

            // --------------------------------------
            // FIND USER
            // --------------------------------------

            const user =
                await User.findById(userId);

            if (!user) {
                console.error(
                    "❌ USER NOT FOUND:",
                    userId
                );

                return res.status(404).json({
                    message:
                        "User not found",
                });
            }

            // --------------------------------------
            // UPDATE PLAN
            // --------------------------------------

            user.plan = plan;

            // Add purchased credits
            user.credits =
                Number(user.credits || 0) +
                Number(credits);

            // Add to total credits
            user.totalCredits =
                Number(user.totalCredits || 0) +
                Number(credits);

            // --------------------------------------
            // PLAN EXPIRY - 30 DAYS
            // --------------------------------------

            user.planExpiresAt =
                new Date(
                    Date.now() +
                    30 *
                    24 *
                    60 *
                    60 *
                    1000
                );

            // --------------------------------------
            // SAVE USER
            // --------------------------------------

            await user.save();

            console.log(
                "✅ USER UPDATED:",
                {
                    userId:
                        user._id.toString(),

                    plan:
                        user.plan,

                    credits:
                        user.credits,

                    totalCredits:
                        user.totalCredits,

                    planExpiresAt:
                        user.planExpiresAt,
                }
            );

            // --------------------------------------
            // UPDATE REDIS SESSION
            // --------------------------------------

            const userSession =
                await redis.get(
                    `user-session-${user._id}`
                );

            if (userSession) {
                try {
                    const sessionData =
                        JSON.parse(
                            userSession
                        );

                    const sessionId =
                        sessionData.sessionId;

                    if (sessionId) {
                        await redis.set(
                            `session-${sessionId}`,

                            JSON.stringify({
                                userId:
                                    user._id.toString(),

                                name:
                                    user.name,

                                email:
                                    user.email,

                                avatar:
                                    user.avatar,

                                plan:
                                    user.plan,

                                credits:
                                    user.credits,

                                totalCredits:
                                    user.totalCredits,

                                planExpiresAt:
                                    user.planExpiresAt,
                            }),

                            "EX",

                            7 * 24 * 60 * 60
                        );

                        console.log(
                            "✅ REDIS SESSION UPDATED"
                        );
                    }
                } catch (error) {
                    console.error(
                        "❌ REDIS SESSION ERROR:",
                        error.message
                    );
                }
            }

            // --------------------------------------
            // RESPONSE
            // --------------------------------------

            return res.status(200).json({
                success: true,

                message:
                    "User payment updated successfully",

                user: {
                    id:
                        user._id,

                    plan:
                        user.plan,

                    credits:
                        user.credits,

                    totalCredits:
                        user.totalCredits,

                    planExpiresAt:
                        user.planExpiresAt,
                },
            });

        } catch (error) {
            console.error(
                "❌ UPDATE USER PAYMENT ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    `Update user payment error: ${error.message}`,
            });
        }
    };


// ==========================================
// CREDITS (internal: agent service only)
// ==========================================

const CREDIT_COST = {
    chat: 1,
    search: 5,
    coding: 10,
    pdf: 10,
    ppt: 10,
    vision: 10,
    pdfRag: 10,
    imageAnalyzer: 10,
};

// Keeps the gateway's cached session (what /api/me returns) in sync.
const refreshSession = async (user) => {
    const userSession = await redis.get(`user-session-${user._id}`);
    if (!userSession) return;

    try {
        const { sessionId } = JSON.parse(userSession);
        if (!sessionId) return;

        await redis.set(
            `session-${sessionId}`,
            JSON.stringify({
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                credits: user.credits,
                totalCredits: user.totalCredits,
                planExpiresAt: user.planExpiresAt,
            }),
            "KEEPTTL"
        );
    } catch (error) {
        console.error("❌ REDIS SESSION ERROR:", error.message);
    }
};

// Charged before the LLM runs. The $gte guard makes check-and-deduct a
// single atomic step, so parallel requests can't overdraw the balance.
export const deductCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const cost = CREDIT_COST[agent] || 1;

        const user = await User.findOneAndUpdate(
            { _id: userId, credits: { $gte: cost } },
            { $inc: { credits: -cost } },
            { new: true }
        );

        if (!user) {
            const exists = await User.findById(userId).select("credits");
            if (!exists) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(402).json({
                message: `Not enough credits. ${agent} needs ${cost}, you have ${exists.credits}.`,
                credits: exists.credits,
                required: cost,
            });
        }

        await refreshSession(user);

        console.log("💳 CREDITS DEDUCTED:", {
            userId, agent, deducted: cost, remaining: user.credits,
        });

        return res.status(200).json({
            success: true,
            credits: user.credits,
            deducted: cost,
            agent,
        });
    } catch (error) {
        console.error("❌ DEDUCT CREDITS ERROR:", error);
        return res.status(500).json({ message: "Deduct credits error" });
    }
};

// Gives credits back when the agent failed after being charged.
export const refundCredits = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const credits = Number(amount);

        if (!userId || !mongoose.isValidObjectId(userId) || !(credits > 0)) {
            return res.status(400).json({ message: "userId and amount are required" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { credits } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await refreshSession(user);

        console.log("↩️ CREDITS REFUNDED:", { userId, refunded: credits, remaining: user.credits });

        return res.status(200).json({ success: true, credits: user.credits });
    } catch (error) {
        console.error("❌ REFUND CREDITS ERROR:", error);
        return res.status(500).json({ message: "Refund credits error" });
    }
};
