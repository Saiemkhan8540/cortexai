import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId, userId) => {
    const key = `messages-${conversationId}`;

    const cached = await redis.get(key);

    if (cached) {
        const parsed = JSON.parse(cached);

        // Agar Redis mein null/invalid value ho
        if (Array.isArray(parsed)) {
            return parsed;
        }

        return [];
    }

    const messages = await getMessages(conversationId, userId);

    const safeMessages = Array.isArray(messages)
        ? messages
        : [];

    await redis.set(
        key,
        JSON.stringify(safeMessages),
        "EX",
        24 * 60 * 60
    );

    return safeMessages;
};


export const addMessage = async (
    conversationId,
    role,
    content,
    images = []
) => {
    const key = `messages-${conversationId}`;

    const rawMessages = await redis.get(key);

    let messages = [];

    if (rawMessages) {
        try {
            const parsed = JSON.parse(rawMessages);

            if (Array.isArray(parsed)) {
                messages = parsed;
            }
        } catch (error) {
            console.log("⚠️ Redis JSON parse error:", error);
            messages = [];
        }
    }

    messages.push({
        role,
        content,
        images,
    });

    if (messages.length > 20) {
        messages.shift();
    }

    await redis.set(
        key,
        JSON.stringify(messages),
        "EX",
        24 * 60 * 60
    );

    console.log("✅ Memory saved:", messages);
};

