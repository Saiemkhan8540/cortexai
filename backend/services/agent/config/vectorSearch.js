import { embeddings } from "./embeddings.js";

// An uploaded PDF is only used for the request it arrives with, so chunks
// are ranked in memory instead of in a vector DB: nothing to clean up and
// no way for one user's document to leak into another's search.

// The Gemini embedding quota counts every chunk (plus the question), and the
// free tier allows 100 per minute across all users. Past this many chunks the
// rest of the PDF is not searched and the answer says so. Raise it on a paid key.
const MAX_CHUNKS = Number(process.env.PDF_MAX_CHUNKS) || 90;

// One batchEmbedContents call per group (the API maximum).
const BATCH_SIZE = 100;

const cosine = (a, b) => {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

const quotaError = () => {
    const error = new Error(
        "PDF search is busy right now (embedding quota reached). Please try again in a minute."
    );
    error.status = 503;
    error.data = { success: false, message: error.message };
    return error;
};

// LangChain fills a failed batch (e.g. HTTP 429) with empty vectors instead
// of throwing, which would silently rank those chunks last. Embed batches one
// at a time, retry once, and fail loudly if vectors are still missing.
const embedAll = async (texts) => {
    const vectors = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        let result = await embeddings.embedDocuments(batch);
        if (result.some((v) => !v?.length)) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            result = await embeddings.embedDocuments(batch);
        }
        if (result.some((v) => !v?.length)) throw quotaError();

        vectors.push(...result);
    }

    return vectors;
};

export const topChunks = async (docs, query, k = 5) => {
    const chunks = docs.slice(0, MAX_CHUNKS);
    const truncated = docs.length > chunks.length;

    const chunkVectors = await embedAll(chunks.map((d) => d.pageContent));
    let queryVector;
    try {
        queryVector = await embeddings.embedQuery(query);
    } catch {
        throw quotaError();
    }
    if (!queryVector?.length) throw quotaError();

    const top = chunks
        .map((doc, i) => ({ doc, score: cosine(chunkVectors[i], queryVector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((x) => x.doc);

    return { docs: top, truncated, searchedChunks: chunks.length, totalChunks: docs.length };
};
