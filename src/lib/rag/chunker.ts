export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

/**
 * Splits raw document text into overlapping character-bounded chunks
 * while preferring paragraph or sentence boundaries.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const maxChunkSize = options.maxChunkSize ?? 800;
  const overlap = options.overlap ?? 120;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChunkSize) {
    return [normalized];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const tentativeEnd = Math.min(start + maxChunkSize, normalized.length);
    let end = tentativeEnd;

    if (tentativeEnd < normalized.length) {
      const slice = normalized.slice(start, tentativeEnd);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastSentence = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? ")
      );

      if (lastParagraph > maxChunkSize * 0.4) {
        end = start + lastParagraph + 2;
      } else if (lastSentence > maxChunkSize * 0.4) {
        end = start + lastSentence + 1;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
