import api from "../../utils/axios";

const RETRIES = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns the user, or null when the visitor is genuinely logged out (401).
// Network errors / 5xx (e.g. the free Render API waking from sleep) are
// retried instead of being treated as "logged out".
const getCurrentUser = async () => {
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            const { data } = await api.get("/api/me");
            return data;
        } catch (error) {
            if (error.response?.status === 401) return null;

            console.log("Get current user error:", error);
            if (attempt === RETRIES) return null;
            await sleep(2000 * (attempt + 1));
        }
    }
    return null;
};

export default getCurrentUser;
