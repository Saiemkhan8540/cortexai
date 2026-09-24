import fs from "fs/promises";
import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import { internalHeaders } from "../../../shared/middleware/requireInternal.js";

// Confirms the conversation exists and belongs to this user before any
// agent runs, so memory/rate-limit/credit work never touches foreign data.
const ownsConversation = async (conversationId, userId) => {
  try {
    await axios.get(
      `${process.env.CHAT_SERVICE}/conversation/${conversationId}`,
      { headers: { "x-user-id": userId } }
    );
    return true;
  } catch (error) {
    if (error.response?.status === 404) return false;
    throw error;
  }
};

export const agent = async (req, res, next) => {
  try {
    const {
      prompt,
      conversationId,
      agent,
    } = req.body;

    const file=req.file

    const userId=req.headers["x-user-id"]

    console.log("🔥 Agent request:", {
      prompt,
      conversationId,
      agent,
    });

    if (!userId) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const text = typeof prompt === "string" ? prompt.trim() : "";

    if (!text && !file) {
      return res.status(400).json({ message: "Message or file is required" });
    }

    if (!conversationId || !(await ownsConversation(conversationId, userId))) {
      return res.status(404).json({ message: "conversation not found" });
    }

    // A file sent without a message still needs a question for the agent.
    const effectivePrompt =
      text ||
      (file?.mimetype === "application/pdf"
        ? "Summarize this PDF."
        : "Describe this image.");

    // What the chat history shows for the user's turn.
    const userContent = text || `📎 ${file.originalname}`;

    // -----------------------------------------
    // RUN GRAPH
    // -----------------------------------------

    const result = await graph.invoke({
      prompt: effectivePrompt,
      conversationId,
      agent: agent || "auto",
      userId,
      file
    });

    console.log("🔥 GRAPH RESULT:", result);

    const response = result.aiResponse;

    console.log("🔥 AI RESPONSE:", response);

    if (!response) {
      throw new Error("AI response is empty");
    }

    // -----------------------------------------
    // ONLY ONE IMAGE
    // -----------------------------------------

    const generatedImages = Array.isArray(result.images)
      ? result.images.filter(Boolean)
      : [];

    // Remove duplicate URLs
    const uniqueImages = [...new Set(generatedImages)];

    // IMPORTANT:
    // Only send ONE image to frontend
    const images = uniqueImages.slice(0, 1);

    console.log("🖼️ GRAPH IMAGES:", generatedImages);
    console.log("🖼️ UNIQUE IMAGES:", uniqueImages);
    console.log("🖼️ FINAL IMAGE:", images);

    // -----------------------------------------
    // SAVE USER MESSAGE
    // -----------------------------------------

    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "user",
        content: userContent,
      },
      { headers: { "x-user-id": userId, ...internalHeaders() } }
    );

    await addMessage(
      conversationId,
      "user",
      userContent
    );

    // -----------------------------------------
    // SAVE ASSISTANT MESSAGE
    // -----------------------------------------

    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "assistant",
        content: response,
        images,
        artifacts: result.artifacts || [],
      },
      { headers: { "x-user-id": userId, ...internalHeaders() } }
    );

    await addMessage(
      conversationId,
      "assistant",
      response,
      images
    );

    // -----------------------------------------
    // SEND RESPONSE TO FRONTEND
    // -----------------------------------------

    return res.status(200).json({
      answer: response,
      images,
      artifacts: result.artifacts || [],
      credits: result.credits,
    });

  } catch (error) {
    console.error(
      "❌ AGENT ERROR:",
      error.response?.data || error
    );

    // Rate-limit errors carry their own status and body.
    return res.status(error.status || 500).json({
      answer: null,
      images: [],
      artifacts: [],
      message: error.message,
      ...(error.data || {}),
    });
  } finally {
    // uploads are only needed for this request
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
};