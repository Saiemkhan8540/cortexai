import { getModel } from "../config/llmModel.js";

export const router = async (state) => {

    // -----------------------------------------
    // UPLOADED FILE (wins over agent selection,
    // otherwise the file would be ignored)
    // -----------------------------------------

    const mimetype = state.file?.mimetype || "";

    if(mimetype==="application/pdf"){
        return {
            ...state,
            agent:"pdfRag"
        }
    }

    if(mimetype.startsWith("image/")){
        return {
            ...state,
            agent:"imageAnalyzer"
        }
    }

    // -----------------------------------------
    // MANUAL AGENT SELECTION
    // -----------------------------------------

    if (
        state.agent &&
        state.agent !== "auto"
    ) {
        return {
            ...state,
            agent: state.agent,
        };
    }

    // -----------------------------------------
    // AI ROUTER
    // -----------------------------------------

    const llm = await getModel("router");

    const prompt = `
You are an agent router for CortexAI.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
General conversation, greetings, explanations,
learning and normal questions.

search:
Current events, latest information,
news, recent developments, current time,
internet lookup and web information.

coding:
Generate code, debug code,
build projects, programming,
API design and software architecture.

pdf:
Generate or analyze PDF documents.

ppt:
Generate or analyze PowerPoint presentations.

vision:
Image understanding and image-related tasks.

Return ONLY ONE WORD from:

chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`;

    const response = await llm.invoke(prompt);

    const selectedAgent = response.content
        .trim()
        .toLowerCase();

    const validAgents = [
        "chat",
        "search",
        "coding",
        "pdf",
        "ppt",
        "vision",
    ];

    const finalAgent = validAgents.includes(
        selectedAgent
    )
        ? selectedAgent
        : "chat";

    console.log(
        "🤖 ROUTER SELECTED:",
        finalAgent
    );

    return {
        ...state,
        agent: finalAgent,
    };
};