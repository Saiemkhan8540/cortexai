import api from "../../utils/axios";

const createOrder = async (
    plan,
    userId
) => {
    try {
        console.log(
            "💳 Creating order:",
            {
                plan,
                userId,
            }
        );

        if (!plan) {
            throw new Error(
                "Plan is required"
            );
        }

        if (!userId) {
            throw new Error(
                "User ID is required"
            );
        }

        const { data } = await api.post(
            "/api/billing/create",
            {
                plan,
            }
        );

        console.log(
            "✅ Create order response:",
            data
        );

        return data;

    } catch (error) {
        console.error(
            "❌ Create order error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};

export default createOrder;
export { createOrder };