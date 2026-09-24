import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModel.js"
import fs from "fs/promises"
import { checkAgentLimit } from "../config/agentLimit.js";

// Answers a question about an uploaded image. The temp file itself is
// removed by the controller.
export const imageAnalyzer = async (state) => {
    await checkAgentLimit(state.userId, "image")

    try {
        const llm = await getModel("imageAnalyzer")

        const imageBuffer = await fs.readFile(state.file.path)
        const base64Image = imageBuffer.toString("base64")

        const messages = [
            new SystemMessage(
                `You are CortexAI image analyzer Agent.

Rules:
- Analyze only the uploaded image.
- Answer the user's question accurately.
- If text exists in the image, extract it.
- If charts or tables exist, explain them.
- If something is unclear, say so.
- Use Markdown when helpful.
- Do not hallucinate.`
            ),
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: state.prompt || "Analyze the image",
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${state.file.mimetype};base64,${base64Image}`
                        }
                    }
                ]
            }),
        ]

        const response = await llm.invoke(messages)

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        if (error.status) throw error;

        console.error("❌ IMAGE ANALYZER ERROR:", error)
        return {
            ...state,
            failed: true,
            aiResponse: "Failed to analyze the image. Please try again."
        }
    }
}
