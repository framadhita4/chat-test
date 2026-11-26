import { connection } from "next/server";
import { CHAT_MODEL_ID, isOpenAIConfigured } from "@/lib/ai/openai";
import { getKonveksiConfig } from "@/lib/konveksi/catalog";
import {
  getActiveVectorProvider,
  getPineconeNamespace,
  isPineconeConfigured,
} from "@/lib/rag";

export async function GET() {
  await connection();
  const pineconeConfigured = isPineconeConfigured();
  const konveksi = getKonveksiConfig();

  return Response.json({
    openaiConfigured: isOpenAIConfigured(),
    pineconeConfigured,
    vectorProvider: getActiveVectorProvider(),
    pineconeIndex: process.env.PINECONE_INDEX?.trim() || null,
    pineconeNamespace: pineconeConfigured ? getPineconeNamespace() : null,
    defaultChatModel: CHAT_MODEL_ID,
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
    konveksiBrandName: konveksi.brandName,
    konveksiCity: konveksi.city,
    konveksiWhatsapp: konveksi.whatsappNumber,
    smartMemoryEnabled: true,
    guardrailsEnabled: true,
  });
}
