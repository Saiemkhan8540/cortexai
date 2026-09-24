import dotenv from "dotenv";

dotenv.config();

import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxRetries: 2,
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
});

const openrouter = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 2500,
  maxRetries: 1, // fail fast on 429 so fallback kicks in quickly
});

// If OpenRouter is rate-limited or down, automatically use Groq instead.
const codingModel = openrouter.withFallbacks({ fallbacks: [groq] });

export const getModel = async (agent) => {
  switch (agent) {
    case "chat":
      return groq;

    case "search":
      return groq;

    case "coding":
      return codingModel;

    case "intent":
      // Intent is a tiny classification task — Groq is fast and reliable for it.
      return groq;

    case "imageAnalyzer":
      return gemini;

    default:
      return groq;
  }
};