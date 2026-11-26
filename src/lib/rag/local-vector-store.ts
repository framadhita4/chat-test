import { cosineSimilarity, embed, embedMany } from "ai";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getEmbeddingModel, isOpenAIConfigured } from "@/lib/ai/openai";
import { chunkText } from "./chunker";
import { STARTER_DOCUMENTS } from "./starter-docs";
import type {
  DocumentChunk,
  KnowledgeDocument,
  VectorSearchResult,
  VectorStoreAdapter,
} from "./types";

interface PersistedStore {
  documents: KnowledgeDocument[];
  chunks: DocumentChunk[];
}

const STORE_FILE_PATH = path.join(process.cwd(), "data", "knowledge-base.json");

function createInitialStore(): PersistedStore {
  const now = new Date().toISOString();
  const documents: KnowledgeDocument[] = [];
  const chunks: DocumentChunk[] = [];

  for (const doc of STARTER_DOCUMENTS) {
    const parts = chunkText(doc.content);
    documents.push({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      content: doc.content,
      createdAt: now,
      chunkCount: parts.length,
      embedded: false,
    });
    parts.forEach((part, index) => {
      chunks.push({
        id: `${doc.id}::chunk-${index}`,
        documentId: doc.id,
        documentTitle: doc.title,
        source: doc.source,
        chunkIndex: index,
        content: part,
      });
    });
  }

  return { documents, chunks };
}

/**
 * Zero-config JSON-persisted vector store for prototyping RAG with OpenAI embeddings.
 * Replace with Qdrant, Pinecone, Upstash Vector, or pgvector via VectorStoreAdapter.
 */
export class LocalVectorStore implements VectorStoreAdapter {
  private memoryStore: PersistedStore | null = null;

  private async loadStore(): Promise<PersistedStore> {
    if (this.memoryStore) {
      return this.memoryStore;
    }

    try {
      const raw = await fs.readFile(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as PersistedStore;
      const legacyStarterIds = new Set([
        "starter-architecture",
        "starter-vectordb-guide",
        "starter-pinecone-setup",
      ]);
      const hasOnlyLegacyStarter =
        parsed.documents.length > 0 &&
        parsed.documents.every((doc) => legacyStarterIds.has(doc.id));

      if (hasOnlyLegacyStarter) {
        const initial = createInitialStore();
        await this.saveStore(initial);
        return initial;
      }

      this.memoryStore = parsed;
      return parsed;
    } catch {
      const initial = createInitialStore();
      await this.saveStore(initial);
      return initial;
    }
  }

  private async saveStore(store: PersistedStore): Promise<void> {
    this.memoryStore = store;
    try {
      await fs.mkdir(path.dirname(STORE_FILE_PATH), { recursive: true });
      await fs.writeFile(
        STORE_FILE_PATH,
        JSON.stringify(store, null, 2),
        "utf-8"
      );
    } catch {
      // Fallback gracefully to in-memory store on read-only filesystems.
    }
  }

  private async ensureAllChunksEmbedded(store: PersistedStore): Promise<void> {
    const unembedded = store.chunks.filter(
      (chunk) => !chunk.embedding || chunk.embedding.length === 0
    );

    if (unembedded.length === 0) {
      return;
    }

    if (!isOpenAIConfigured()) {
      throw new Error(
        "OPENAI_API_KEY belum dikonfigurasi. Tambahkan OPENAI_API_KEY di .env.local untuk membuat embedding RAG."
      );
    }

    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: unembedded.map((chunk) => chunk.content),
    });

    unembedded.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    const embeddedDocIds = new Set(
      store.chunks
        .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
        .map((chunk) => chunk.documentId)
    );

    store.documents = store.documents.map((doc) => ({
      ...doc,
      embedded: embeddedDocIds.has(doc.id),
    }));

    await this.saveStore(store);
  }

  async listDocuments(): Promise<KnowledgeDocument[]> {
    const store = await this.loadStore();
    return [...store.documents].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async upsertDocument(input: {
    id?: string;
    title: string;
    source: string;
    content: string;
  }): Promise<KnowledgeDocument> {
    const store = await this.loadStore();
    const id = input.id?.trim() || crypto.randomUUID();
    const parts = chunkText(input.content);

    if (parts.length === 0) {
      throw new Error("Konten dokumen tidak boleh kosong.");
    }

    let embeddings: Array<number[] | undefined> = parts.map(() => undefined);
    let embedded = false;

    if (isOpenAIConfigured()) {
      const result = await embedMany({
        model: getEmbeddingModel(),
        values: parts,
      });
      embeddings = result.embeddings;
      embedded = true;
    }

    // Remove previous chunks for this document id if updating
    store.chunks = store.chunks.filter((chunk) => chunk.documentId !== id);
    store.documents = store.documents.filter((doc) => doc.id !== id);

    const newDoc: KnowledgeDocument = {
      id,
      title: input.title.trim(),
      source: input.source.trim() || `doc://${id}`,
      content: input.content.trim(),
      createdAt: new Date().toISOString(),
      chunkCount: parts.length,
      embedded,
    };

    const newChunks: DocumentChunk[] = parts.map((content, chunkIndex) => ({
      id: `${id}::chunk-${chunkIndex}`,
      documentId: id,
      documentTitle: newDoc.title,
      source: newDoc.source,
      chunkIndex,
      content,
      embedding: embeddings[chunkIndex],
    }));

    store.documents.push(newDoc);
    store.chunks.push(...newChunks);
    await this.saveStore(store);

    return newDoc;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const store = await this.loadStore();
    const before = store.documents.length;
    store.documents = store.documents.filter((doc) => doc.id !== documentId);
    store.chunks = store.chunks.filter(
      (chunk) => chunk.documentId !== documentId
    );

    if (store.documents.length === before) {
      return false;
    }

    await this.saveStore(store);
    return true;
  }

  async search(query: string, topK = 4): Promise<VectorSearchResult[]> {
    const store = await this.loadStore();
    if (store.chunks.length === 0) {
      return [];
    }

    await this.ensureAllChunksEmbedded(store);

    const { embedding: queryEmbedding } = await embed({
      model: getEmbeddingModel(),
      value: query,
    });

    const scored = store.chunks
      .filter((chunk): chunk is DocumentChunk & { embedding: number[] } =>
        Boolean(chunk.embedding && chunk.embedding.length > 0)
      )
      .map((chunk) => {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          chunk: {
            id: chunk.id,
            documentId: chunk.documentId,
            documentTitle: chunk.documentTitle,
            source: chunk.source,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
          },
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }
}
