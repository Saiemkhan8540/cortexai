import {
    HumanMessage,
    SystemMessage,
    AIMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModel.js";
import { getMemory } from "../config/memory.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const chatAgent = async (state) => {
    try {

        await checkAgentLimit(state.userId, "chat")
        
        console.log(
            "🔥 CHAT AGENT STARTED"
        );

        // -----------------------------------------
        // GET CHAT MODEL
        // -----------------------------------------

        const llm = await getModel("chat");

        // -----------------------------------------
        // VALIDATE PROMPT
        // -----------------------------------------

        if (
            typeof state.prompt !== "string" ||
            !state.prompt.trim()
        ) {
            throw new Error(
                "Prompt is missing"
            );
        }

        // -----------------------------------------
        // CURRENT TIME QUERY
        // -----------------------------------------

        const promptLower =
            state.prompt.toLowerCase();

        const isTimeQuery =
            promptLower.includes(
                "current time"
            ) ||
            promptLower.includes(
                "what time is it"
            ) ||
            promptLower.includes(
                "time in india"
            ) ||
            promptLower.includes(
                "india time"
            ) ||
            promptLower.includes(
                "ist time"
            );

        if (isTimeQuery) {
            const currentTime =
                new Intl.DateTimeFormat(
                    "en-IN",
                    {
                        timeZone:
                            "Asia/Kolkata",

                        hour: "numeric",

                        minute: "2-digit",

                        second: "2-digit",

                        hour12: true,
                    }
                ).format(
                    new Date()
                );

            const currentDate =
                new Intl.DateTimeFormat(
                    "en-IN",
                    {
                        timeZone:
                            "Asia/Kolkata",

                        weekday: "long",

                        day: "2-digit",

                        month: "long",

                        year: "numeric",
                    }
                ).format(
                    new Date()
                );

            const exactTimeResponse =
                `The current time in India (IST) is **${currentTime}** on **${currentDate}**.`;

            console.log(
                "🕐 EXACT INDIA TIME:",
                exactTimeResponse
            );

            // Time query also consumes chat credit

            return {
                ...state,

                aiResponse:
                    exactTimeResponse,
            };
        }

        // -----------------------------------------
        // MEMORY
        // -----------------------------------------

        const history =
            (await getMemory(
                state.conversationId,
                state.userId
            )) || [];

        console.log(
            "🧠 MEMORY:",
            history
        );

        // -----------------------------------------
        // SEARCH CONTEXT
        // -----------------------------------------

        let searchContext = "";

        if (
            state.searchResults &&
            Array.isArray(
                state.searchResults.results
            )
        ) {
            searchContext = `
Web Search Results:

${state.searchResults.results
    .map((item, index) => {
        return `
Result ${index + 1}:

Title:
${item.title || ""}

URL:
${item.url || ""}

Content:
${item.content || ""}
`;
    })
    .join("\n")}

Use these search results to answer the user's question.

Do not mention internal tools.
`;
        }

        // -----------------------------------------
        // SYSTEM PROMPT
        // -----------------------------------------

        const systemPrompt = `
You are CortexAI, an intelligent AI assistant.

${searchContext}

Rules:

- For simple questions, greetings, and short queries, respond naturally.
- For technical, education, coding, or detailed topics, use clean Markdown.
- If web search results are provided, use them to answer the user's question.
- Do not mention internal tools or agents.
- Never invent information.

Formatting:

- Use # for titles.
- Use ## for sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never generate large walls of text.
`;

        // -----------------------------------------
        // MESSAGES
        // -----------------------------------------

        const messages = [
            new SystemMessage(
                systemPrompt
            ),
        ];

        // -----------------------------------------
        // ADD MEMORY SAFELY
        // -----------------------------------------

        if (
            Array.isArray(history)
        ) {
            history.forEach(
                (msg) => {
                    if (
                        !msg ||
                        typeof msg !==
                            "object"
                    ) {
                        return;
                    }

                    if (
                        typeof msg.content !==
                            "string" ||
                        !msg.content.trim()
                    ) {
                        console.log(
                            "⚠️ Invalid memory skipped:",
                            msg
                        );

                        return;
                    }

                    if (
                        msg.role ===
                        "user"
                    ) {
                        messages.push(
                            new HumanMessage(
                                msg.content
                            )
                        );
                    }

                    if (
                        msg.role ===
                        "assistant"
                    ) {
                        messages.push(
                            new AIMessage(
                                msg.content
                            )
                        );
                    }
                }
            );
        }

        // -----------------------------------------
        // CURRENT USER MESSAGE
        // -----------------------------------------

        messages.push(
            new HumanMessage(
                state.prompt
            )
        );

        console.log(
            "🔥 MESSAGES SENT TO LLM:",
            messages
        );

        // -----------------------------------------
        // CALL LLM
        // -----------------------------------------

        const response =
            await llm.invoke(
                messages
            );

        console.log(
            "🤖 AI RESPONSE:",
            response.content
        );

        // -----------------------------------------
        // DEDUCT CHAT CREDIT
        // -----------------------------------------


        // -----------------------------------------
        // RETURN STATE
        // -----------------------------------------

        return {
            ...state,

            aiResponse:
                response.content,

            images:
                state.images || [],
        };

    } catch (error) {
        console.error(
            "❌ CHAT AGENT ERROR:",
            error
        );

        throw error;
    }
};










// import {
//     HumanMessage,
//     SystemMessage,
//     AIMessage,
// } from "@langchain/core/messages";

// import { getModel } from "../config/llmModel.js";
// import { getMemory } from "../config/memory.js";

// export const chatAgent = async (state) => {
//     try {
//         console.log("🔥 CHAT AGENT STARTED");

//         const llm = await getModel("chat");

//         // Get conversation memory
//         const history = await getMemory(state.conversationId);

//         console.log("🧠 MEMORY:", history);

//         // --------------------------------------------------
//         // SEARCH CONTEXT
//         // --------------------------------------------------

//         let searchContext = "";

//         if (
//             state.searchResults &&
//             Array.isArray(state.searchResults.results)
//         ) {
//             searchContext = `
// Web Search Results:

// ${state.searchResults.results
//     .map((item, index) => {
//         return `
// Result ${index + 1}:
// Title: ${item.title || ""}
// URL: ${item.url || ""}
// Content: ${item.content || ""}
// `;
//     })
//     .join("\n")}

// Use these search results to answer the user's question.

// Do not mention internal tools.
// `;
//         }

//         // --------------------------------------------------
//         // SYSTEM PROMPT
//         // --------------------------------------------------

//         const systemPrompt = `
// You are CortexAI, an intelligent AI assistant.

// ${searchContext}

// Rules:

// - For simple questions, greetings, and short queries, respond naturally.
// - For technical, education, coding, or detailed topics, use clean Markdown.
// - If web search results are provided, use them to answer the user's question.
// - Do not mention internal tools or agents.

// Formatting:

// - Use # for titles.
// - Use ## for sections.
// - Leave a blank line after headings.
// - Use bullet points for lists.
// - Use numbered lists for steps.
// - Use fenced code blocks with language tags for code.
// - Keep paragraphs short and readable.
// - Never generate large walls of text.
// `;

//         // --------------------------------------------------
//         // CREATE MESSAGES
//         // --------------------------------------------------

//         const messages = [
//             new SystemMessage(systemPrompt),
//         ];

//         // --------------------------------------------------
//         // ADD MEMORY SAFELY
//         // --------------------------------------------------

//         if (Array.isArray(history)) {
//             history.forEach((msg) => {

//                 // Invalid memory object ko ignore karo
//                 if (!msg || typeof msg !== "object") {
//                     return;
//                 }

//                 // Content missing hai to ignore karo
//                 if (
//                     typeof msg.content !== "string" ||
//                     !msg.content.trim()
//                 ) {
//                     console.log(
//                         "⚠️ Invalid memory message skipped:",
//                         msg
//                     );

//                     return;
//                 }

//                 if (msg.role === "user") {
//                     messages.push(
//                         new HumanMessage(msg.content)
//                     );
//                 }

//                 if (msg.role === "assistant") {
//                     messages.push(
//                         new AIMessage(msg.content)
//                     );
//                 }
//             });
//         }

//         // --------------------------------------------------
//         // CURRENT USER MESSAGE
//         // --------------------------------------------------

//         if (
//             typeof state.prompt !== "string" ||
//             !state.prompt.trim()
//         ) {
//             throw new Error("Prompt is missing");
//         }

//         messages.push(
//             new HumanMessage(state.prompt)
//         );

//         console.log(
//             "🔥 MESSAGES SENT TO LLM:",
//             messages
//         );

//         // --------------------------------------------------
//         // CALL LLM
//         // --------------------------------------------------

//         const response = await llm.invoke(messages);

//         console.log(
//             "🤖 AI RESPONSE:",
//             response.content
//         );

//         // --------------------------------------------------
//         // RETURN STATE
//         // --------------------------------------------------

//         return {
//             ...state,
//             aiResponse: response.content,
//         };

//     } catch (error) {

//         console.error(
//             "❌ CHAT AGENT ERROR:",
//             error
//         );

//         throw error;
//     }
// };



//###############
// import { getModel } from "../config/llmModel"

// export const chatAgent = async (state) => {
//     const llm = await getModel("chat")
//     const systemprompt = "you are cortexAI, an intelligent AI assistant."
//     const response = await llm.invoke([
//         {
//             "role": "system",
//             "content":systemPrompt
//         },
//         {
//             "role": "human",
//             "content":state.prompt
//         }
//     ])

//     return {
//         ...state,
//         aiResponse:response.content
//     }
// }