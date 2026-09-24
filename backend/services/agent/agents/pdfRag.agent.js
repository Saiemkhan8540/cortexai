import fs from "fs/promises"
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { topChunks } from "../config/vectorSearch.js";
import { getModel } from "../config/llmModel.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { checkAgentLimit } from "../config/agentLimit.js";

// Answers a question about an uploaded PDF. The temp file itself is
// removed by the controller.
export const pdfRag = async (state) => {
    await checkAgentLimit(state.userId, "pdf")

    try {
        const buffer = await fs.readFile(state.file.path)

        const parser = new PDFParse({ data: buffer })
        const result = await parser.getText()
        await parser.destroy()

        const text = (result.text || "").trim()

        if (!text) {
            return {
                ...state,
                failed: true,
                aiResponse: "I couldn't read any text from this PDF. It may be a scanned image.",
            }
        }

        // Larger chunks cover more of the PDF per embedding (quota-bound).
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 200
        })

        const docs = await splitter.createDocuments([text])

        const search = await topChunks(docs, state.prompt, 5)

        const context = search.docs.map(d => d.pageContent).join("\n\n")

        const llm = await getModel("pdf-rag")

        const messages = [
            new SystemMessage(`You are CortexAI PDF Assistant.

Rules:
- Answer ONLY from the uploaded PDF.
- Never make up information.
- If the answer is not present in the PDF, reply:
"I couldn't find this information in the uploaded PDF."
- Use Markdown formatting.
`),
            new HumanMessage(`Context:
${context}

Question:
${state.prompt}`)
        ]

        const response = await llm.invoke(messages)

        const note = search.truncated
            ? `\n\n> ⚠️ This PDF is large: only the first ${Math.round(100 * search.searchedChunks / search.totalChunks)}% of it was searched.`
            : ""

        return {
            ...state,
            aiResponse: response.content + note
        }

    } catch (error) {
        if (error.status) throw error;

        console.error("❌ PDF RAG ERROR:", error)
        return {
            ...state,
            failed: true,
            aiResponse: "Failed to analyze the PDF. Please try again."
        }
    }
}
