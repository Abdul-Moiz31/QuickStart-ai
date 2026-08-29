import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE, } from "@quickstart-ai/shared";
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized)
        return [];
    if (normalized.length <= chunkSize)
        return [normalized];
    const chunks = [];
    let start = 0;
    while (start < normalized.length) {
        let end = Math.min(start + chunkSize, normalized.length);
        if (end < normalized.length) {
            const slice = normalized.slice(start, end);
            const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "), slice.lastIndexOf(" "));
            if (breakAt > chunkSize * 0.4) {
                end = start + breakAt + 1;
            }
        }
        const chunk = normalized.slice(start, end).trim();
        if (chunk)
            chunks.push(chunk);
        if (end >= normalized.length)
            break;
        start = Math.max(0, end - overlap);
    }
    return chunks;
}
//# sourceMappingURL=chunking.js.map