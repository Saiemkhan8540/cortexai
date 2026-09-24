import { StateGraph, START, END } from "@langchain/langgraph";

import { agentState } from "./state.js";
import { router } from "./router.js";

import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { visionAgent } from "../agents/vision.agent.js";
import { pdfRag } from "../agents/pdfRag.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";
import { withCredits } from "../utils/deductCredits.js";

// ==========================================
// CREATE WORKFLOW
// ==========================================

const workflow = new StateGraph(agentState);

// ==========================================
// ADD NODES
// ==========================================
// Every agent node is charged before it runs (see withCredits).

workflow.addNode("router", router);

workflow.addNode("chat", withCredits("chat", chatAgent));

workflow.addNode("search", withCredits("search", searchAgent));

workflow.addNode("pdf", withCredits("pdf", pdfAgent));

workflow.addNode("ppt", withCredits("ppt", pptAgent));

workflow.addNode("coding", withCredits("coding", codingAgent));

workflow.addNode("vision", withCredits("vision", visionAgent));

workflow.addNode("pdfRag", withCredits("pdfRag", pdfRag));

workflow.addNode("imageAnalyzer", withCredits("imageAnalyzer", imageAnalyzer));

// ==========================================
// START
// ==========================================

workflow.addEdge(
    START,
    "router"
);

// ==========================================
// ROUTER
// ==========================================

workflow.addConditionalEdges(
    "router",

    (state) => {

        switch (state.agent) {

            case "chat":
                return "chat";

            case "search":
                return "search";

            case "pdf":
                return "pdf";

            case "ppt":
                return "ppt";

            case "coding":
                return "coding";

            case "vision":
                return "vision";

            case "pdfRag":
                return "pdfRag";

            case "imageAnalyzer":
                return "imageAnalyzer";

            default:
                return "chat";
        }
    },

    {
        chat: "chat",

        search: "search",

        pdf: "pdf",

        ppt: "ppt",

        coding: "coding",

        vision: "vision",

        pdfRag: "pdfRag",

        imageAnalyzer: "imageAnalyzer",
    }
);

// ==========================================
// SEARCH → CHAT
// ==========================================

workflow.addEdge(
    "search",
    "chat"
);

// ==========================================
// AGENTS → END
// ==========================================

workflow.addEdge(
    "chat",
    END
);

workflow.addEdge(
    "coding",
    END
);

workflow.addEdge(
    "pdf",
    END
);

workflow.addEdge(
    "ppt",
    END
);

workflow.addEdge(
    "vision",
    END
);

workflow.addEdge(
    "pdfRag",
    END
);

workflow.addEdge(
    "imageAnalyzer",
    END
);

// ==========================================
// COMPILE GRAPH
// ==========================================

export const graph =
    workflow.compile();