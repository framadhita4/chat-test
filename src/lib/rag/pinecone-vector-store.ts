import {
  Pinecone,
  type Index,
  type RecordMetadata,
} from "@pinecone-database/pinecone";
import { embed, embedMany } from "ai";
import { getEmbeddingModel, isOpenAIConfigured } from "@/lib/ai/openai";
import { chunkText } from "./chunker";
import type {
  KnowledgeDocument,
  VectorSearchResult,
  VectorStoreAdapter,
} from "./types";

interface PineconeChunkMetadata extends RecordMetadata {
  documentId: string;
  documentTitle: string;
  source: string;
  chunkIndex: number;
  chunkCount: number;
  content: string;
  createdAt: string;
}

type IndexMode =
  | { kind: "vector" }
  | {
      kind: "document-integrated";
      embedField: string;
      textField: string;
      hasTitleField: boolean;
    }
  | {
      kind: "document-dense";
      denseField: string;
      textField: string;
      hasTitleField: boolean;
    };

const UPSERT_BATCH_SIZE = 50;
const FETCH_BATCH_SIZE = 100;
const DELETE_BATCH_SIZE = 100;
const MAX_LIST_PAGES = 20;

export function isPineconeConfigured(): boolean {
  return Boolean(
    process.env.PINECONE_API_KEY?.trim() && process.env.PINECONE_INDEX?.trim(),
  );
}

export function getPineconeNamespace(): string {
  return process.env.PINECONE_NAMESPACE?.trim() || "rag-docs";
}

function parseDocumentIdFromVectorId(vectorId: string): string {
  const separatorIndex = vectorId.indexOf("::chunk-");
  if (separatorIndex > 0) {
    return vectorId.slice(0, separatorIndex);
  }
  return vectorId;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * VectorStoreAdapter backed by Pinecone Serverless.
 * Supports both classic vector indexes and schema-based document indexes
 * (including Pinecone integrated embedding models via the Documents API).
 */
export class PineconeVectorStore implements VectorStoreAdapter {
  private client: Pinecone | null = null;
  private indexClient: Index<PineconeChunkMetadata> | null = null;
  private indexModePromise: Promise<IndexMode> | null = null;

  private getClientAndIndex(): {
    client: Pinecone;
    index: Index<PineconeChunkMetadata>;
    indexName: string;
  } {
    const apiKey = process.env.PINECONE_API_KEY?.trim();
    const indexName = process.env.PINECONE_INDEX?.trim();
    const host = process.env.PINECONE_HOST?.trim() || undefined;
    const namespace = getPineconeNamespace();

    if (!apiKey || !indexName) {
      throw new Error(
        "PINECONE_API_KEY dan PINECONE_INDEX wajib diatur di .env.local.",
      );
    }

    if (!this.client) {
      this.client = new Pinecone({ apiKey });
    }

    if (!this.indexClient) {
      this.indexClient = this.client.index<PineconeChunkMetadata>({
        name: indexName,
        host,
        namespace,
      });
    }

    return { client: this.client, index: this.indexClient, indexName };
  }

  private async resolveIndexMode(): Promise<IndexMode> {
    if (this.indexModePromise) {
      return this.indexModePromise;
    }

    this.indexModePromise = (async (): Promise<IndexMode> => {
      const { client, indexName } = this.getClientAndIndex();
      try {
        const description = await client.describeIndex(indexName);
        const fields = description.schema?.fields;

        if (!fields || Object.keys(fields).length === 0) {
          return { kind: "vector" };
        }

        const fieldEntries = Object.entries(fields);
        const hasTitleField = "title" in fields;

        // 1. Check for integrated embedding field (string with `embed` or `semantic_text`)
        for (const [fieldName, fieldDef] of fieldEntries) {
          if (fieldDef && typeof fieldDef === "object" && "type" in fieldDef) {
            if (
              fieldDef.type === "string" &&
              "embed" in fieldDef &&
              fieldDef.embed
            ) {
              return {
                kind: "document-integrated",
                embedField: fieldName,
                textField: fieldName,
                hasTitleField,
              };
            }
            if (fieldDef.type === "semantic_text") {
              return {
                kind: "document-integrated",
                embedField: fieldName,
                textField: fieldName,
                hasTitleField,
              };
            }
          }
        }

        // 2. Check for schema-based dense_vector field
        for (const [fieldName, fieldDef] of fieldEntries) {
          if (
            fieldDef &&
            typeof fieldDef === "object" &&
            "type" in fieldDef &&
            fieldDef.type === "dense_vector"
          ) {
            const stringField = fieldEntries.find(
              ([name, def]) =>
                name !== "title" &&
                def &&
                typeof def === "object" &&
                "type" in def &&
                def.type === "string",
            )?.[0];

            return {
              kind: "document-dense",
              denseField: fieldName,
              textField: stringField || "content",
              hasTitleField,
            };
          }
        }

        // 3. Schema exists with typed fields (e.g., text-only schema)
        const hasTypedSchema = fieldEntries.some(
          ([, def]) => def && typeof def === "object" && "type" in def,
        );
        if (hasTypedSchema) {
          const preferredTextField =
            "chunk_text" in fields
              ? "chunk_text"
              : "content" in fields
                ? "content"
                : fieldEntries[0][0];
          return {
            kind: "document-integrated",
            embedField: preferredTextField,
            textField: preferredTextField,
            hasTitleField,
          };
        }

        return { kind: "vector" };
      } catch {
        // Reset cached promise on failure so subsequent requests can retry
        this.indexModePromise = null;
        return { kind: "vector" };
      }
    })();

    return this.indexModePromise;
  }

  private async listRecordIds(prefix?: string): Promise<string[]> {
    const { index } = this.getClientAndIndex();
    const mode = await this.resolveIndexMode();
    const ids: string[] = [];
    let paginationToken: string | undefined;

    for (let page = 0; page < MAX_LIST_PAGES; page++) {
      if (mode.kind === "vector") {
        const res = await index.listPaginated({
          prefix,
          limit: 100,
          paginationToken,
        });

        for (const vec of res.vectors ?? []) {
          if (vec.id) {
            ids.push(vec.id);
          }
        }

        paginationToken = res.pagination?.next;
      } else {
        const res = await index.documents.list({
          prefix,
          limit: 100,
          paginationToken,
        });

        for (const doc of res.documents ?? []) {
          if (doc._id) {
            ids.push(doc._id);
          }
        }

        paginationToken = res.pagination?.next;
      }

      if (!paginationToken) {
        break;
      }
    }

    return ids;
  }

  async listDocuments(): Promise<KnowledgeDocument[]> {
    const { index } = this.getClientAndIndex();
    const mode = await this.resolveIndexMode();
    const recordIds = await this.listRecordIds();

    if (recordIds.length === 0) {
      return [];
    }

    // Group chunk IDs by documentId and pick the first chunk (prefer ::chunk-0)
    const docChunkCounts = new Map<string, number>();
    const representativeIds = new Map<string, string>();

    for (const id of recordIds) {
      const docId = parseDocumentIdFromVectorId(id);
      docChunkCounts.set(docId, (docChunkCounts.get(docId) ?? 0) + 1);

      const currentRep = representativeIds.get(docId);
      if (!currentRep || id.endsWith("::chunk-0")) {
        representativeIds.set(docId, id);
      }
    }

    const idsToFetch = Array.from(representativeIds.values());
    const documents: KnowledgeDocument[] = [];

    for (const batch of chunkArray(idsToFetch, FETCH_BATCH_SIZE)) {
      if (mode.kind === "vector") {
        const fetched = await index.fetch({ ids: batch });
        for (const [recordId, record] of Object.entries(
          fetched.records ?? {},
        )) {
          const meta = record?.metadata;
          const docId =
            meta?.documentId || parseDocumentIdFromVectorId(recordId);
          documents.push({
            id: docId,
            title: meta?.documentTitle || docId,
            source: meta?.source || "pinecone://record",
            content: meta?.content || "",
            createdAt: meta?.createdAt || new Date(0).toISOString(),
            chunkCount: meta?.chunkCount ?? docChunkCounts.get(docId) ?? 1,
            embedded: true,
          });
        }
      } else {
        const fetched = await index.documents.fetch({ ids: batch });
        for (const [recordId, record] of Object.entries(
          fetched.documents ?? {},
        )) {
          const docId =
            asString(record.documentId) ||
            parseDocumentIdFromVectorId(recordId);
          const content =
            asString(record[mode.textField]) ||
            asString(record.content) ||
            asString(record.chunk_text) ||
            asString(record.text);

          documents.push({
            id: docId,
            title:
              asString(record.documentTitle) || asString(record.title) || docId,
            source: asString(record.source, "pinecone://document"),
            content,
            createdAt: asString(record.createdAt, new Date(0).toISOString()),
            chunkCount: asNumber(
              record.chunkCount,
              docChunkCounts.get(docId) ?? 1,
            ),
            embedded: true,
          });
        }
      }
    }

    return documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsertDocument(input: {
    id?: string;
    title: string;
    source: string;
    content: string;
  }): Promise<KnowledgeDocument> {
    const { index } = this.getClientAndIndex();
    const mode = await this.resolveIndexMode();
    const id = input.id?.trim() || crypto.randomUUID();
    const parts = chunkText(input.content);

    if (parts.length === 0) {
      throw new Error("Konten dokumen tidak boleh kosong.");
    }

    const needsClientEmbeddings = mode.kind !== "document-integrated";
    let embeddings: number[][] = [];

    if (needsClientEmbeddings) {
      if (!isOpenAIConfigured()) {
        throw new Error(
          "OPENAI_API_KEY belum dikonfigurasi. Tambahkan OPENAI_API_KEY di .env.local untuk membuat embedding RAG.",
        );
      }

      const embeddedResult = await embedMany({
        model: getEmbeddingModel(),
        values: parts,
      });
      embeddings = embeddedResult.embeddings;
    }

    // Clean up previous chunks if updating an existing document ID
    if (input.id?.trim()) {
      await this.deleteDocument(id);
    }

    const createdAt = new Date().toISOString();
    const title = input.title.trim();
    const source = input.source.trim() || `doc://${id}`;

    if (mode.kind === "vector") {
      const records = parts.map((content, chunkIndex) => ({
        id: `${id}::chunk-${chunkIndex}`,
        values: embeddings[chunkIndex],
        metadata: {
          documentId: id,
          documentTitle: title,
          source,
          chunkIndex,
          chunkCount: parts.length,
          content,
          createdAt,
        } satisfies PineconeChunkMetadata,
      }));

      for (const batch of chunkArray(records, UPSERT_BATCH_SIZE)) {
        await index.upsert({ records: batch });
      }
    } else {
      const documents = parts.map((content, chunkIndex) => {
        const doc: Record<string, unknown> = {
          _id: `${id}::chunk-${chunkIndex}`,
          documentId: id,
          documentTitle: title,
          source,
          chunkIndex,
          chunkCount: parts.length,
          createdAt,
          [mode.textField]: content,
        };

        if (mode.hasTitleField) {
          doc.title = title;
        }
        if (mode.textField !== "content") {
          doc.content = content;
        }
        if (mode.kind === "document-dense") {
          doc[mode.denseField] = embeddings[chunkIndex];
        }

        return doc as { _id: string; [key: string]: unknown };
      });

      for (const batch of chunkArray(documents, UPSERT_BATCH_SIZE)) {
        await index.documents.upsert({ documents: batch });
      }
    }

    return {
      id,
      title,
      source,
      content: input.content.trim(),
      createdAt,
      chunkCount: parts.length,
      embedded: true,
    };
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const { index } = this.getClientAndIndex();
    const mode = await this.resolveIndexMode();
    const prefix = `${documentId}::chunk-`;
    const matchingIds = await this.listRecordIds(prefix);

    if (matchingIds.length === 0) {
      return false;
    }

    for (const batch of chunkArray(matchingIds, DELETE_BATCH_SIZE)) {
      if (mode.kind === "vector") {
        await index.deleteMany({ ids: batch });
      } else {
        await index.documents.delete({ ids: batch });
      }
    }

    return true;
  }

  async search(query: string, topK = 4): Promise<VectorSearchResult[]> {
    const { index } = this.getClientAndIndex();
    const mode = await this.resolveIndexMode();

    if (mode.kind === "vector") {
      if (!isOpenAIConfigured()) {
        throw new Error(
          "OPENAI_API_KEY belum dikonfigurasi. Tambahkan OPENAI_API_KEY di .env.local untuk mencari di Pinecone.",
        );
      }

      const { embedding: queryEmbedding } = await embed({
        model: getEmbeddingModel(),
        value: query,
      });

      const response = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return (response.matches ?? []).map((match) => {
        const meta = match.metadata;
        const docId = meta?.documentId || parseDocumentIdFromVectorId(match.id);

        return {
          chunk: {
            id: match.id,
            documentId: docId,
            documentTitle: meta?.documentTitle || docId,
            source: meta?.source || "pinecone://record",
            chunkIndex: meta?.chunkIndex ?? 0,
            content: meta?.content || "",
          },
          score: match.score ?? 0,
        };
      });
    }

    if (mode.kind === "document-dense") {
      if (!isOpenAIConfigured()) {
        throw new Error(
          "OPENAI_API_KEY belum dikonfigurasi. Tambahkan OPENAI_API_KEY di .env.local untuk mencari di Pinecone.",
        );
      }

      const { embedding: queryEmbedding } = await embed({
        model: getEmbeddingModel(),
        value: query,
      });

      const response = await index.documents.search({
        scoreBy: [
          {
            type: "dense_vector",
            field: mode.denseField,
            values: queryEmbedding,
          },
        ],
        topK,
        includeFields: ["*"],
      });

      return (response.matches ?? []).map((match) => {
        const docId =
          asString(match.documentId) || parseDocumentIdFromVectorId(match._id);
        const content =
          asString(match[mode.textField]) ||
          asString(match.content) ||
          asString(match.chunk_text) ||
          asString(match.text);

        return {
          chunk: {
            id: match._id,
            documentId: docId,
            documentTitle:
              asString(match.documentTitle) || asString(match.title) || docId,
            source: asString(match.source, "pinecone://document"),
            chunkIndex: asNumber(match.chunkIndex, 0),
            content,
          },
          score: match._score ?? 0,
        };
      });
    }

    // Integrated embedding document search (Pinecone embeds query server-side)
    const response = await index.documents.search({
      scoreBy: [
        {
          type: "embed",
          field: mode.embedField,
          query,
        },
      ],
      topK,
      includeFields: ["*"],
    });

    return (response.matches ?? []).map((match) => {
      const docId =
        asString(match.documentId) || parseDocumentIdFromVectorId(match._id);
      const content =
        asString(match[mode.textField]) ||
        asString(match.content) ||
        asString(match.chunk_text) ||
        asString(match.text);

      return {
        chunk: {
          id: match._id,
          documentId: docId,
          documentTitle:
            asString(match.documentTitle) || asString(match.title) || docId,
          source: asString(match.source, "pinecone://document"),
          chunkIndex: asNumber(match.chunkIndex, 0),
          content,
        },
        score: match._score ?? 0,
      };
    });
  }
}
