import api from "../../utils/axios";

async function sendMessage(payload) {
  try {
    console.log("🔥 sendMessage payload:", payload);

    const { data } = await api.post(
      "/api/agent/chat",
      payload
    );

    console.log("🔥 sendMessage API response:", data);

    return data;
  } catch (error) {
    console.error(
      "❌ sendMessage API error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

export default sendMessage;

