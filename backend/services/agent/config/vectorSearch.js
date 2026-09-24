import { embeddings } from "./embeddings.js";

// An uploaded PDF is only used for the request it arrives with, so chunks
// are ranked in memory instead of in a vector DB: nothing to clean up and
// no way for one user's document to leak into another's search.

// Bounds embedding cost/latency for very large PDFs (~200k characters).
const MAX_CHUNKS = 200;

const cosine = (a, b) => {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

export const topChunks = async (docs, query, k = 5) => {
    const chunks = docs.slice(0, MAX_CHUNKS);

    const [chunkVectors, queryVector] = await Promise.all([
        embeddings.embedDocuments(chunks.map((d) => d.pageContent)),
        embeddings.embedQuery(query),
    ]);

    return chunks
        .map((doc, i) => ({ doc, score: cosine(chunkVectors[i], queryVector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((x) => x.doc);
};
