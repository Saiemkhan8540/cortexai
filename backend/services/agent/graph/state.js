import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  prompt: Annotation(),
  aiResponse: Annotation(),
  agent: Annotation(),
  conversationId: Annotation(),
  userId: Annotation(),
  file: Annotation(),
  failed: Annotation(),
  credits: Annotation(),

  searchResults: Annotation({
    reducer: (_, next) => next,
    default: () => [],
  }),

  images: Annotation({
    reducer: (_, next) => next,
    default: () => [],
  }),

  artifacts: Annotation({
    reducer: (_, next) => next,
    default: () => [],
  }),
});