import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModel.js";

// ============================================================
// HELPERS
// ============================================================

// Pull the JSON object out of the LLM reply even if it wrapped it
// in ```json fences or added a sentence before/after.
const extractJson = (raw) => {
    let text = String(raw).trim();

    text = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        throw new Error("AI did not return a JSON object");
    }

    return JSON.parse(text.slice(start, end + 1));
};

// Guess a language from a file name (used only if the LLM forgets
// to fill the "language" field).
const languageFromName = (name = "") => {
    const ext = name.split(".").pop().toLowerCase();

    const map = {
        py: "python",
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        html: "html",
        css: "css",
        java: "java",
        c: "c",
        cpp: "cpp",
        cc: "cpp",
        h: "c",
        cs: "csharp",
        go: "go",
        rs: "rust",
        rb: "ruby",
        php: "php",
        swift: "swift",
        kt: "kotlin",
        sql: "sql",
        sh: "bash",
        json: "json",
        md: "markdown",
        yml: "yaml",
        yaml: "yaml",
    };

    return map[ext] || "plaintext";
};

// ============================================================
// AGENT
// ============================================================

export const codingAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "coding")
        // -----------------------------------------
        // GET MODELS
        // -----------------------------------------

        const intentLlm = await getModel("intent");
        const llm = await getModel("coding");

        // -----------------------------------------
        // INTENT CLASSIFICATION
        // -----------------------------------------

        const intentRes = await intentLlm.invoke(`
You are an intent classifier.

Return ONLY one of these values:

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSATION
DOCUMENTATION

User Request:
${state.prompt}
`);

        const intent = String(intentRes.content)
            .trim()
            .toUpperCase();

        console.log("🧠 Detected Intent:", intent);

        // -----------------------------------------
        // CODE GENERATION
        // -----------------------------------------

        if (intent === "CODE_GENERATION") {
            const prompt = `
You are CortexAI Coding Agent.

Your job is to generate the code the user asked for, in the
language / framework the user asked for.

LANGUAGE RULES (very important):

1. If the user names a language (Python, Java, C++, Go, Rust,
   JavaScript, TypeScript, etc.), write the code in THAT language.
   Never substitute HTML/CSS/JS for it.
2. If the user names a framework (React, Next.js, Vue, Express,
   Flask, Django, FastAPI, etc.), use that framework.
3. Only produce a website (index.html + style.css + script.js)
   when the user asks for a website, web page, landing page,
   UI, or something that clearly must run in a browser and
   does NOT name another language.
4. If no language is mentioned and the task is a script,
   algorithm, function, or program, default to Python.

FILE RULES:

- Use correct file extensions: main.py, Main.java, main.cpp,
  main.go, main.rs, index.js, app.ts, index.html, etc.
- One file is fine for small programs. Add more files only
  when the task genuinely needs them.
- Code must be complete and runnable, with brief comments.
- Include example usage / a main entry point where sensible.

OUTPUT FORMAT:

Return ONLY valid JSON. No markdown, no code fences,
no text before or after the JSON.

Schema:

{
  "language": "python",
  "title": "Short title for this project (max 6 words)",
  "summary": "2-4 sentences explaining what the code does and how to run it.",
  "files": [
    {
      "name": "main.py",
      "language": "python",
      "content": "full file content here"
    }
  ]
}

Rules for the JSON:

- Output must start with { and end with }
- "files" must contain at least one file
- Every file needs "name", "language" and "content"
- Escape newlines and quotes inside "content" correctly
- Never mention intent classification

User Request:
${state.prompt}
`;

            const llmRes = await llm.invoke(prompt);

            const data = extractJson(llmRes.content);

            // -----------------------------------------
            // VALIDATE + NORMALISE FILES
            // -----------------------------------------

            if (
                !Array.isArray(data.files) ||
                data.files.length === 0
            ) {
                throw new Error(
                    "AI did not return any project files"
                );
            }

            const files = data.files
                .filter(
                    (f) =>
                        f &&
                        typeof f.name === "string" &&
                        typeof f.content === "string"
                )
                .map((f) => ({
                    name: f.name.trim(),
                    language:
                        typeof f.language === "string" &&
                        f.language.trim()
                            ? f.language.trim().toLowerCase()
                            : languageFromName(f.name),
                    content: f.content,
                }));

            if (files.length === 0) {
                throw new Error(
                    "AI returned files in an invalid shape"
                );
            }

            const language =
                typeof data.language === "string" &&
                data.language.trim()
                    ? data.language.trim().toLowerCase()
                    : files[0].language;

            const title =
                typeof data.title === "string" &&
                data.title.trim()
                    ? data.title.trim()
                    : String(state.prompt).slice(0, 60);

            const summary =
                typeof data.summary === "string" &&
                data.summary.trim()
                    ? data.summary.trim()
                    : `Generated ${files.length} ${language} file(s).`;

            // Deduct coding credits only after successful generation

            console.log(
                `✅ Code generated (${language}, ${files.length} file(s))`
            );

            return {
                ...state,

                aiResponse: summary,

                artifacts: [
                    {
                        id: Date.now(),
                        type: "Project",
                        language,
                        title,
                        files,
                    },
                ],
            };
        }

        // -----------------------------------------
        // OTHER CODING TASKS
        // -----------------------------------------

        const response = await llm.invoke(`
The user's request is:

${state.prompt}

The detected intent is:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code (if needed)

User Request:

${state.prompt}
`);

        const markdown = String(response.content);

        // Deduct coding credits after successful response

        return {
            ...state,
            aiResponse: markdown,
            artifacts: [],
        };

        } catch (error) {
        // rate-limit (429) and credit errors go back to the client as-is
        if (error.status) throw error;

        console.error("❌ CODING AGENT ERROR:", error);

        const isRateLimit =
            error?.statusCode === 429 || error?.code === 429;

        return {
            ...state,
            failed: true,
            aiResponse: isRateLimit
                ? "The coding model is busy right now. Please try again in a few seconds."
                : "Sorry, I could not process your coding request. Please try again.",
            artifacts: [],
        };
    }
};