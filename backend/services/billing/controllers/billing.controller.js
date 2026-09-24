import crypto from "crypto";
import axios from "axios";

import razorpay from "../config/razorpay.js";
import { PLANS } from "../config/Plans.js";
import Payment from "../models/payment.model.js";
import { internalHeaders } from "../../../shared/middleware/requireInternal.js";

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (
    req,
    res
) => {
    try {
        const { plan } =
            req.body;

        const userId =
            req.headers[
                "x-user-id"
            ];

        console.log(
            "💳 CREATE ORDER:",
            {
                plan,
                userId,
            }
        );

        // USER CHECK

        if (!userId) {
            return res.status(401).json({
                message:
                    "User ID is missing",
            });
        }

        // PLAN CHECK

        const selectedPlan =
            PLANS[plan];

        if (!selectedPlan) {
            return res.status(404).json({
                message:
                    "Plan not found",
            });
        }

        // FREE PLAN

        if (
            selectedPlan.amount === 0
        ) {
            return res.status(400).json({
                message:
                    "Free plan does not require payment",
            });
        }

        // CREATE RAZORPAY ORDER

        const order =
            await razorpay.orders.create(
                {
                    amount:
                        selectedPlan.amount *
                        100,

                    currency:
                        "INR",

                    receipt:
                        `receipt-${Date.now()}`,
                }
            );

        console.log(
            "✅ RAZORPAY ORDER:",
            order.id
        );

        // SAVE PAYMENT

        const payment =
            await Payment.create({
                userId:

                    userId,

                orderId:
                    order.id,

                amount:
                    selectedPlan.amount,

                currency:
                    order.currency,

                credits:
                    selectedPlan.credits,

                plan:
                    selectedPlan.id,

                status:
                    "created",
            });

        console.log(
            "✅ PAYMENT SAVED:",
            payment._id
        );

        return res.status(200).json({
            success: true,

            order,

            plan:
                selectedPlan,
        });

    } catch (error) {
        console.error(
            "❌ CREATE ORDER ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Create order error: ${error.message}`,
        });
    }
};

// ==========================================
// HELPERS
// ==========================================

const hmacHex = (secret, data) =>
    crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("hex");

const safeEqual = (a, b) => {
    const x = Buffer.from(String(a || ""));
    const y = Buffer.from(String(b || ""));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Atomically flips created -> paid so the checkout callback and the
// webhook can both arrive without crediting the user twice. If auth
// fails, the order is reopened so a retry or the webhook can finish it.
const creditPayment = async (orderId, paymentId) => {
    const payment = await Payment.findOneAndUpdate(
        { orderId, status: "created" },
        { status: "paid", paymentId },
        { new: true }
    );

    if (!payment) {
        const existing = await Payment.findOne({ orderId });
        return { payment: existing, alreadyPaid: existing?.status === "paid" };
    }

    try {
        const authResponse = await axios.post(
            `${process.env.AUTH_SERVICE}/update-plan`,
            {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
            },
            { headers: internalHeaders() }
        );

        console.log("✅ USER PLAN UPDATED:", authResponse.data?.user);

        return { payment, user: authResponse.data?.user };
    } catch (error) {
        await Payment.updateOne(
            { _id: payment._id },
            { status: "created" }
        );
        throw error;
    }
};

// ==========================================
// VERIFY PAYMENT (checkout callback)
// ==========================================

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const userId = req.headers["x-user-id"];

        console.log("💰 VERIFY PAYMENT:", {
            razorpay_order_id,
            razorpay_payment_id,
        });

        if (!userId) {
            return res.status(401).json({ message: "unauthorized" });
        }

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Payment details are missing",
            });
        }

        const generatedSignature = hmacHex(
            process.env.RAZORPAY_KEY_SECRET,
            `${razorpay_order_id}|${razorpay_payment_id}`
        );

        if (!safeEqual(generatedSignature, razorpay_signature)) {
            return res.status(400).json({
                message: "Payment Verification Failed",
            });
        }

        // The order must belong to the user verifying it.
        const existing = await Payment.findOne({
            orderId: razorpay_order_id,
            userId,
        });

        if (!existing) {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        const { payment, user, alreadyPaid } = await creditPayment(
            razorpay_order_id,
            razorpay_payment_id
        );

        if (alreadyPaid) {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment Verified",
            payment: {
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                plan: payment.plan,
                credits: payment.credits,
            },
            user,
        });
    } catch (error) {
        console.error(
            "❌ VERIFY PAYMENT ERROR:",
            error.response?.data || error
        );

        return res.status(500).json({
            message: "Payment verification failed. If money was deducted, credits will be added shortly.",
        });
    }
};

// ==========================================
// RAZORPAY WEBHOOK
// ==========================================
// Credits the user even if the browser closed before /verify ran.
// Needs the raw body (see index.js) and RAZORPAY_WEBHOOK_SECRET.

export const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            return res.status(503).json({
                message: "webhook not configured",
            });
        }

        const signature = req.headers["x-razorpay-signature"];

        if (!safeEqual(hmacHex(secret, req.body), signature)) {
            return res.status(400).json({ message: "invalid signature" });
        }

        const event = JSON.parse(req.body.toString("utf8"));

        if (
            event.event === "payment.captured" ||
            event.event === "order.paid"
        ) {
            const entity = event.payload?.payment?.entity;

            if (entity?.order_id) {
                await creditPayment(entity.order_id, entity.id);
            }
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("❌ WEBHOOK ERROR:", error.response?.data || error);
        // non-2xx makes Razorpay retry
        return res.status(500).json({ message: "webhook failed" });
    }
};
