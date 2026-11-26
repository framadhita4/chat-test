export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  content: string;
  createdAt: string;
  chunkCount: number;
  embedded: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  source: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
}

export interface VectorSearchResult {
  chunk: Omit<DocumentChunk, "embedding">;
  score: number;
}

export interface VectorStoreAdapter {
  listDocuments(): Promise<KnowledgeDocument[]>;
  upsertDocument(input: {
    id?: string;
    title: string;
    source: string;
    content: string;
  }): Promise<KnowledgeDocument>;
  deleteDocument(documentId: string): Promise<boolean>;
  search(query: string, topK?: number): Promise<VectorSearchResult[]>;
}
