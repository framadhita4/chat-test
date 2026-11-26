import { LocalVectorStore } from "./local-vector-store";
import {
  getPineconeNamespace,
  isPineconeConfigured,
  PineconeVectorStore,
} from "./pinecone-vector-store";
import type { VectorStoreAdapter } from "./types";

let localStoreInstance: LocalVectorStore | null = null;
let pineconeStoreInstance: PineconeVectorStore | null = null;

export type ActiveVectorProvider = "pinecone" | "local";

export function getActiveVectorProvider(): ActiveVectorProvider {
  return isPineconeConfigured() ? "pinecone" : "local";
}

/**
 * Returns the active VectorStoreAdapter.
 * Uses Pinecone when PINECONE_API_KEY and PINECONE_INDEX are configured,
 * otherwise falls back to LocalVectorStore for zero-config local runs.
 */
export function getVectorStore(): VectorStoreAdapter {
  if (isPineconeConfigured()) {
    if (!pineconeStoreInstance) {
      pineconeStoreInstance = new PineconeVectorStore();
    }
    return pineconeStoreInstance;
  }

  if (!localStoreInstance) {
    localStoreInstance = new LocalVectorStore();
  }
  return localStoreInstance;
}

export { getPineconeNamespace, isPineconeConfigured };
export * from "./types";
