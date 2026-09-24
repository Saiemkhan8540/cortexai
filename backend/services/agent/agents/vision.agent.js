import { getModel } from "../config/llmModel.js";
import axios from "axios";

import { uploadToS3 } from "../utils/uploadToS3.js";
import { newFileName, userFileKey, fileUrl } from "../utils/userFile.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const visionAgent = async (state) => {
    try {
      await checkAgentLimit(state.userId, "vision")
        // -----------------------------------------
        // GET IMAGE MODEL
        // -----------------------------------------

        const llm = await getModel("image");

        // -----------------------------------------
        // GENERATE IMAGE PROMPT
        // -----------------------------------------

        const res = await llm.invoke(`
You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirements:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return only the image prompt.

User Request:
${state.prompt}
`);

        const prompt = String(res.content).trim();

        console.log("🎨 Generated Image Prompt:", prompt);

        // -----------------------------------------
        // GENERATE IMAGE URL
        // -----------------------------------------

        const imageUrl =
            `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

        console.log("🖼️ Image URL:", imageUrl);

        // -----------------------------------------
        // DOWNLOAD IMAGE
        // -----------------------------------------

        const imageRes = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });

        console.log("✅ Image downloaded successfully");

        // -----------------------------------------
        // CREATE BUFFER
        // -----------------------------------------

        const buffer = Buffer.from(imageRes.data);

        // -----------------------------------------
        // CREATE FILE NAME
        // -----------------------------------------

        const filename = newFileName("image", "png");

        console.log("📁 Filename:", filename);

        // -----------------------------------------
        // UPLOAD TO S3
        // -----------------------------------------

        await uploadToS3(
            userFileKey(state.userId, filename),
            buffer,
            "image/png"
        );

        console.log(
            "☁️ Image uploaded to S3 successfully"
        );

        // -----------------------------------------
        // GENERATE SIGNED URL
        // -----------------------------------------

        const downloadUrl = fileUrl(state.userId, filename);

        console.log(
            "🔗 Signed URL generated"
        );

        // -----------------------------------------
        // DEDUCT CREDIT
        // -----------------------------------------


        // -----------------------------------------
        // RETURN RESULT
        // -----------------------------------------

        return {
            ...state,

            images: [downloadUrl],

            aiResponse: `
[Download Image](${downloadUrl})

`,
        };

    } catch (error) {
        // rate-limit (429) and credit errors go back to the client as-is
        if (error.status) throw error;

        console.error(
            "❌ VISION AGENT ERROR:",
            error
        );

        return {
            ...state,
            failed: true,

            images: [],

            aiResponse:
                `Sorry, I could not generate the image. ${error.message}`,
        };
    }
};