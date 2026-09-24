import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";

export const searchAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "search")
        // -----------------------------------------
        // SEARCH
        // -----------------------------------------

        const results = await searchTool.invoke({
            query: state.prompt,
        });

        console.log(
            "🔎 Search results:",
            results
        );

        console.log(
            "🖼️ Search images:",
            results.images
        );

        // -----------------------------------------
        // DEDUCT CREDIT
        // -----------------------------------------


        // -----------------------------------------
        // RETURN RESULT
        // -----------------------------------------

        return {
            ...state,

            searchResults: results,

            images: results.images || [],
        };

    } catch (error) {
        // rate-limit (429) and credit errors go back to the client as-is
        if (error.status) throw error;

        console.error(
            "❌ SEARCH AGENT ERROR:",
            error
        );

        return {
            ...state,
            failed: true,

            searchResults: null,

            images: [],

            aiResponse:
                `Sorry, search failed. ${error.message}`,
        };
    }
};