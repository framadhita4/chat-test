import { openai } from "@ai-sdk/openai";

export const CHAT_MODEL_ID = "gpt-4o-mini" as const;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getChatModel() {
  return openai(CHAT_MODEL_ID);
}

export function getEmbeddingModel() {
  const modelId =
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  return openai.embedding(modelId);
}
