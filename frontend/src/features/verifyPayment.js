import api from "../../utils/axios";

export const verifyPayment = async (
    paymentData
) => {
    try {
        console.log(
            "💰 Sending payment verification:",
            paymentData
        );

        const { data } = await api.post(
            "/api/billing/verify",
            paymentData
        );

        console.log(
            "✅ Verify Payment Response:",
            data
        );

        return data;

    } catch (error) {
        console.error(
            "❌ Verify payment error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};

export default verifyPayment;