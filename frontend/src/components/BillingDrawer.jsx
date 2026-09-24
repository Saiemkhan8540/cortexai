import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Crown, X } from "lucide-react";
import { useSelector } from "react-redux";

import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";

function BillingDrawer({ open, onClose }) {
    const { userData } = useSelector(
        (state) => state.user
    );

    // ==========================================
    // GET USER ID SAFELY
    // ==========================================

    const userId =
        userData?.userId;

    // ==========================================
    // START RAZORPAY PAYMENT
    // ==========================================

    const handleUpgrade = async (plan) => {
        try {
            console.log(
                "💳 Starting payment for:",
                plan
            );

            console.log(
                "👤 Current user:",
                userData
            );

            console.log(
                "🆔 User ID:",
                userId
            );

            // --------------------------------------
            // CHECK USER
            // --------------------------------------

            if (!userId) {
                alert(
                    "User session not found. Please login again."
                );
                return;
            }

            // --------------------------------------
            // CHECK RAZORPAY
            // --------------------------------------

            if (!window.Razorpay) {
                alert(
                    "Razorpay is not loaded. Please refresh the page."
                );
                return;
            }

            // --------------------------------------
            // CREATE ORDER
            // --------------------------------------

            const data = await createOrder(
                plan,
                userId
            );

            console.log(
                "✅ Order created:",
                data
            );

            if (!data?.order?.id) {
                throw new Error(
                    "Razorpay order was not created"
                );
            }

            const {
                order,
                plan: selectedPlan,
            } = data;

            // --------------------------------------
            // RAZORPAY OPTIONS
            // --------------------------------------

            const options = {
                key: import.meta.env
                    .VITE_RAZORPAY_KEY_ID,

                amount: order.amount,

                currency: order.currency,

                name: "CortexAI",

                description:
                    `${selectedPlan.name} Plan`,

                order_id: order.id,
                prefill: {
                    name:
                        userData?.name || "",

                    email:
                        userData?.email || "",
                },

                theme: {
                    color: "#4f46e5",
                },

                // ----------------------------------
                // PAYMENT SUCCESS
                // ----------------------------------

                handler: async function (
                    response
                ) {
                    try {
                        console.log(
                            "💰 Razorpay response:",
                            response
                        );

                        console.log(
                            "🔐 Razorpay Payment Details:",
                            {
                                razorpay_order_id:
                                    response.razorpay_order_id,
                                razorpay_payment_id:
                                    response.razorpay_payment_id,
                                razorpay_signature:
                                    response.razorpay_signature,
                            }
                        );

                        // ------------------------------
                        // VERIFY PAYMENT
                        // ------------------------------

                        const verifyData =
                            await verifyPayment({
                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature,
                            });

                        console.log(
                            "✅ Payment verified:",
                            verifyData
                        );

                        // ------------------------------
                        // SUCCESS
                        // ------------------------------

                        alert(
                            "Payment successful! 🎉"
                        );

                        onClose();

                        // ------------------------------
                        // REFRESH USER
                        // ------------------------------

                        window.location.reload();

                    } catch (error) {
                        console.error(
                            "❌ Payment verification failed:",
                            error
                        );

                        alert(
                            error.response?.data
                                ?.message ||
                            error.message ||
                            "Payment verification failed"
                        );
                    }
                },

                // ----------------------------------
                // PAYMENT FAILED
                // ----------------------------------

                modal: {
                    ondismiss: function () {
                        console.log(
                            "Payment popup closed"
                        );
                    },
                },
            };

            // --------------------------------------
            // OPEN RAZORPAY
            // --------------------------------------

            const razorpay =
                new window.Razorpay(
                    options
                );

            razorpay.on(
                "payment.failed",
                function (response) {
                    console.error(
                        "❌ Payment failed:",
                        response
                    );

                    alert(
                        response.error
                            ?.description ||
                        "Payment failed"
                    );
                }
            );

            razorpay.open();

        } catch (error) {
            console.error(
                "❌ Upgrade error:",
                error
            );

            alert(
                error.response?.data
                    ?.message ||
                error.message ||
                "Unable to start payment"
            );
        }
    };

    // ==========================================
    // CURRENT PLAN
    // ==========================================

    const currentPlan =
        userData?.plan || "free";

    const currentCredits =
        Number(
            userData?.credits ?? 100
        );

    let totalCredits = 100;

    if (currentPlan === "starter") {
        totalCredits = 500;
    }

    if (currentPlan === "pro") {
        totalCredits = 1000;
    }

    const creditPercentage =
        totalCredits > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (currentCredits /
                        totalCredits) *
                        100
                )
            )
            : 0;

    // ==========================================
    // UI
    // ==========================================

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* OVERLAY */}

                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 0.55,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        onClick={onClose}
                        className="
                            fixed
                            inset-0
                            bg-black
                            z-40
                        "
                    />

                    {/* BILLING DRAWER */}

                    <motion.div
                        initial={{
                            x: "100%",
                        }}
                        animate={{
                            x: 0,
                        }}
                        exit={{
                            x: "100%",
                        }}
                        transition={{
                            duration: 0.25,
                        }}
                        className="
                            fixed
                            right-0
                            top-0
                            z-50
                            h-screen
                            w-full
                            sm:w-[420px]
                            bg-[#0b0d14]
                            border-l
                            border-white/10
                            shadow-2xl
                            flex
                            flex-col
                        "
                    >

                        {/* HEADER */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                px-6
                                py-5
                                border-b
                                border-white/10
                            "
                        >
                            <div>
                                <h2
                                    className="
                                        text-2xl
                                        font-bold
                                        text-white
                                    "
                                >
                                    Billing
                                </h2>

                                <p
                                    className="
                                        text-sm
                                        text-slate-400
                                        mt-1
                                    "
                                >
                                    Plans & Credits
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    bg-white/5
                                    text-slate-400
                                    hover:text-white
                                    hover:bg-white/10
                                    transition
                                    flex
                                    items-center
                                    justify-center
                                "
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* CONTENT */}

                        <div
                            className="
                                flex-1
                                overflow-y-auto
                                p-6
                            "
                        >

                            {/* CURRENT PLAN */}

                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-[#151821]
                                    p-6
                                    mb-6
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-start
                                        justify-between
                                    "
                                >
                                    <div>

                                        <p
                                            className="
                                                text-slate-400
                                                text-sm
                                                mb-2
                                            "
                                        >
                                            Current Plan
                                        </p>

                                        <h3
                                            className="
                                                text-3xl
                                                font-bold
                                                text-white
                                                capitalize
                                            "
                                        >
                                            {currentPlan}
                                        </h3>

                                    </div>

                                    <Crown
                                        size={32}
                                        className="
                                            text-yellow-400
                                        "
                                    />

                                </div>

                                {/* CREDITS */}

                                <div className="mt-6">

                                    <div
                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            mb-2
                                        "
                                    >

                                        <span
                                            className="
                                                text-slate-300
                                                text-sm
                                            "
                                        >
                                            Credits
                                        </span>

                                        <span
                                            className="
                                                text-slate-300
                                                text-sm
                                            "
                                        >
                                            {currentCredits}/
                                            {totalCredits}
                                        </span>

                                    </div>

                                    <div
                                        className="
                                            h-3
                                            rounded-full
                                            bg-white/10
                                            overflow-hidden
                                        "
                                    >
                                        <div
                                            className="
                                                h-full
                                                rounded-full
                                                bg-gradient-to-r
                                                from-violet-500
                                                to-indigo-500
                                                transition-all
                                            "
                                            style={{
                                                width:
                                                    `${creditPercentage}%`,
                                            }}
                                        />
                                    </div>

                                </div>

                            </div>

                            {/* TITLE */}

                            <div className="mb-5">

                                <h3
                                    className="
                                        text-xl
                                        font-semibold
                                        text-white
                                    "
                                >
                                    Upgrade your plan
                                </h3>

                                <p
                                    className="
                                        text-sm
                                        text-slate-400
                                        mt-1
                                    "
                                >
                                    Get more credits and
                                    unlock higher limits.
                                </p>

                            </div>

                            {/* STARTER */}

                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-[#11141c]
                                    p-6
                                    mb-5
                                    hover:border-indigo-500/40
                                    transition
                                "
                            >

                                <h4
                                    className="
                                        text-xl
                                        font-semibold
                                        text-white
                                    "
                                >
                                    Starter Plan
                                </h4>

                                <p
                                    className="
                                        text-3xl
                                        font-bold
                                        text-indigo-400
                                        mt-3
                                    "
                                >
                                    ₹199
                                </p>

                                <p
                                    className="
                                        text-slate-400
                                        mt-2
                                    "
                                >
                                    500 Credits
                                </p>

                                <button
                                    onClick={() =>
                                        handleUpgrade(
                                            "starter"
                                        )
                                    }
                                    disabled={
                                        currentPlan ===
                                        "starter"
                                    }
                                    className="
                                        mt-6
                                        w-full
                                        py-3
                                        rounded-xl
                                        bg-violet-600
                                        text-white
                                        font-semibold
                                        hover:bg-violet-500
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                        transition
                                    "
                                >
                                    {currentPlan ===
                                    "starter"
                                        ? "Current Plan"
                                        : "Upgrade"}
                                </button>

                            </div>

                            {/* PRO */}

                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-indigo-500/30
                                    bg-[#11141c]
                                    p-6
                                    hover:border-indigo-500/60
                                    transition
                                "
                            >

                                <div
                                    className="
                                        flex
                                        justify-between
                                        items-start
                                    "
                                >

                                    <div>

                                        <h4
                                            className="
                                                text-xl
                                                font-semibold
                                                text-white
                                            "
                                        >
                                            Pro Plan
                                        </h4>

                                        <p
                                            className="
                                                text-3xl
                                                font-bold
                                                text-indigo-400
                                                mt-3
                                            "
                                        >
                                            ₹499
                                        </p>

                                        <p
                                            className="
                                                text-slate-400
                                                mt-2
                                            "
                                        >
                                            1000 Credits
                                        </p>

                                    </div>

                                    <Crown
                                        size={24}
                                        className="
                                            text-yellow-400
                                        "
                                    />

                                </div>

                                <button
                                    onClick={() =>
                                        handleUpgrade(
                                            "pro"
                                        )
                                    }
                                    disabled={
                                        currentPlan ===
                                        "pro"
                                    }
                                    className="
                                        mt-6
                                        w-full
                                        py-3
                                        rounded-xl
                                        bg-violet-600
                                        text-white
                                        font-semibold
                                        hover:bg-violet-500
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                        transition
                                    "
                                >
                                    {currentPlan ===
                                    "pro"
                                        ? "Current Plan"
                                        : "Upgrade"}
                                </button>

                            </div>

                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default BillingDrawer;