import {
  convertToModelMessages,
  generateText,
  pruneMessages,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
} from "ai";
import { getChatModel } from "@/lib/ai/openai";
import { formatRupiah, type KonveksiOrderDraft } from "@/lib/konveksi/catalog";

export interface MemoryStats {
  originalEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  savedTokens: number;
  compactedTurns: number;
  recentMessagesKept: number;
}

export interface ConversationMemory {
  summary: string;
  compactedMessageCount: number;
  lastCompactedMessageId: string | null;
  compactedOriginalTokens: number;
  keyFacts: string[];
  stats: MemoryStats;
}

export interface SmartMemoryResult {
  modelMessages: ModelMessage[];
  memoryPromptSection: string | null;
  updatedMemory: ConversationMemory;
}

/** Number of recent non-rejected UI messages kept in full conversational window */
export const RECENT_WINDOW_MESSAGES = 6;

/** Minimum uncompacted older messages before triggering an LLM summary update */
const COMPACT_BATCH_SIZE = 4;

/** Or compact sooner if uncompacted older messages exceed this token threshold */
const COMPACT_TOKEN_THRESHOLD = 550;

/** Hard token cap for the active ModelMessage[] history sent to the main model */
const MAX_ACTIVE_MODEL_TOKENS = 2800;

/** Max chars per historical message text (excluding the latest user message) */
const MAX_HISTORY_TEXT_CHARS = 1200;

export function createEmptyMemory(): ConversationMemory {
  return {
    summary: "",
    compactedMessageCount: 0,
    lastCompactedMessageId: null,
    compactedOriginalTokens: 0,
    keyFacts: [],
    stats: {
      originalEstimatedTokens: 0,
      optimizedEstimatedTokens: 0,
      savedTokens: 0,
      compactedTurns: 0,
      recentMessagesKept: 0,
    },
  };
}

/**
 * Conservative token estimator (~3.5 chars/token for mixed Indonesian/English/JSON).
 */
export function estimateTextTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}

function estimateRawUIMessageTokens(message: UIMessage): number {
  try {
    return estimateTextTokens(JSON.stringify(message.parts));
  } catch {
    return 100;
  }
}

function estimateModelMessagesTokens(messages: ModelMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      total += estimateTextTokens(msg.content) + 4;
    } else {
      try {
        total += estimateTextTokens(JSON.stringify(msg.content)) + 4;
      } catch {
        total += 50;
      }
    }
  }
  return total;
}

function isGuardrailRejectedMessage(message: UIMessage): boolean {
  const metadata = message.metadata as
    | { guardrailRejected?: boolean }
    | undefined;
  return Boolean(metadata?.guardrailRejected);
}

/**
 * Removes guardrail-rejected assistant replies AND the preceding user prompt
 * that triggered them so off-topic noise never drains future context tokens.
 */
export function filterValidConversationMessages(
  messages: UIMessage[],
): UIMessage[] {
  const valid: UIMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "assistant" && isGuardrailRejectedMessage(msg)) {
      if (valid.length > 0 && valid[valid.length - 1].role === "user") {
        valid.pop();
      }
      continue;
    }
    valid.push(msg);
  }
  return valid;
}

function getUIMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function summarizeToolPartsCompact(message: UIMessage): string[] {
  const notes: string[] = [];
  for (const part of message.parts) {
    if (
      part.type === "tool-calculateKonveksiQuote" &&
      part.state === "output-available" &&
      part.output &&
      typeof part.output === "object"
    ) {
      const q = part.output as {
        productName?: string;
        fabricName?: string;
        quantity?: number;
        totalPrice?: number;
      };
      if (q.productName && q.quantity && q.totalPrice) {
        notes.push(
          `[Quote: ${q.quantity} pcs ${q.productName} (${q.fabricName || "-"}) = ${formatRupiah(q.totalPrice)}]`,
        );
      }
    } else if (
      part.type === "tool-prepareKonveksiOrder" &&
      part.state === "output-available" &&
      part.output &&
      typeof part.output === "object"
    ) {
      const o = part.output as {
        readyToSend?: boolean;
        missingFields?: string[];
      };
      notes.push(
        o.readyToSend
          ? "[Order: siap kirim WA]"
          : `[Order: kurang ${(o.missingFields || []).join(", ")}]`,
      );
    }
  }
  return notes;
}

function serializeMessageForSummary(message: UIMessage): string {
  const role = message.role === "user" ? "Pelanggan" : "Asisten";
  const text = getUIMessageText(message);
  const compactText =
    text.length > 360 ? `${text.slice(0, 360)}...` : text;
  const toolNotes = summarizeToolPartsCompact(message);
  const combined = [compactText, ...toolNotes].filter(Boolean).join(" ");
  return `${role}: ${combined || "(interaksi tool)"}`;
}

/**
 * Strips heavy tool calls/outputs from intermediate UI messages that are slightly
 * older than the active window while waiting for the next batch compaction.
 */
function stripMessageToTextOnly(message: UIMessage): UIMessage | null {
  const text = getUIMessageText(message);
  const toolNotes = summarizeToolPartsCompact(message);
  const mergedText = [
    text.length > MAX_HISTORY_TEXT_CHARS
      ? `${text.slice(0, MAX_HISTORY_TEXT_CHARS)}...`
      : text,
    ...toolNotes,
  ]
    .filter(Boolean)
    .join("\n");

  if (!mergedText) return null;

  return {
    id: message.id,
    role: message.role,
    metadata: message.metadata,
    parts: [{ type: "text", text: mergedText }],
  };
}

/**
 * Truncates excessively long historical text parts (never touches the latest user message).
 */
function clampHistoricalText(messages: UIMessage[]): UIMessage[] {
  const lastIndex = messages.length - 1;
  return messages.map((msg, idx) => {
    if (idx === lastIndex && msg.role === "user") {
      return msg;
    }
    let changed = false;
    const parts = msg.parts.map((part) => {
      if (part.type === "text" && part.text.length > MAX_HISTORY_TEXT_CHARS) {
        changed = true;
        return {
          ...part,
          text: `${part.text.slice(0, MAX_HISTORY_TEXT_CHARS)}... [dipersingkat]`,
        };
      }
      return part;
    });
    return changed ? { ...msg, parts } : msg;
  });
}

/**
 * Deterministically extracts critical business facts (0 LLM tokens) so exact
 * prices, specs, and order fields are never distorted by summarization.
 */
function extractDeterministicKeyFacts(
  messages: UIMessage[],
  previousFacts: string[],
  orderDraft?: Partial<KonveksiOrderDraft>,
): string[] {
  const facts = new Set<string>(previousFacts);

  for (const msg of messages) {
    for (const part of msg.parts) {
      if (
        part.type === "tool-calculateKonveksiQuote" &&
        part.state === "output-available" &&
        part.output &&
        typeof part.output === "object"
      ) {
        const q = part.output as {
          productName?: string;
          fabricName?: string;
          printMethodName?: string;
          quantity?: number;
          totalPrice?: number;
          dpAmount?: number;
        };
        if (q.productName && q.quantity && q.totalPrice) {
          facts.add(
            `Estimasi terakhir: ${q.quantity} pcs ${q.productName}${q.fabricName ? ` (${q.fabricName})` : ""}${q.printMethodName ? `, ${q.printMethodName}` : ""} = ${formatRupiah(q.totalPrice)}${q.dpAmount ? ` (DP ${formatRupiah(q.dpAmount)})` : ""}`,
          );
        }
      }
    }
  }

  if (orderDraft) {
    const orderParts: string[] = [];
    if (orderDraft.productName) orderParts.push(orderDraft.productName);
    if (orderDraft.fabricName) orderParts.push(orderDraft.fabricName);
    if (orderDraft.quantity) orderParts.push(`${orderDraft.quantity} pcs`);
    if (orderDraft.color) orderParts.push(`warna ${orderDraft.color}`);
    if (orderParts.length > 0) {
      facts.add(`Spesifikasi order aktif: ${orderParts.join(", ")}`);
    }
  }

  // Keep only the most recent 6 facts to keep prompt compact
  return Array.from(facts).slice(-6);
}

async function summarizeEvictedMessages(
  previousSummary: string,
  evictedMessages: UIMessage[],
): Promise<string> {
  const transcript = evictedMessages
    .map(serializeMessageForSummary)
    .join("\n");

  try {
    const { text } = await generateText({
      model: getChatModel(),
      temperature: 0,
      maxOutputTokens: 240,
      system: [
        "Anda adalah pembuat ringkasan memori percakapan untuk asisten konveksi.",
        "Gabungkan 'Ringkasan Sebelumnya' dan 'Percakapan Baru yang Dipadatkan' menjadi ringkasan padat Bahasa Indonesia (maksimal 6 poin singkat).",
        "Pertahankan: produk yang dibahas, bahan kain, metode sablon/bordir, jumlah, warna, estimasi harga, preferensi pelanggan, dan pertanyaan yang belum selesai.",
        "Hapus basa-basi, sapaan, dan penjelasan katalog panjang. Jangan mengarang angka baru.",
      ].join("\n"),
      prompt: [
        previousSummary
          ? `Ringkasan Sebelumnya:\n${previousSummary}`
          : "Ringkasan Sebelumnya: (kosong)",
        `Percakapan Baru yang Dipadatkan:\n${transcript}`,
      ].join("\n\n"),
    });

    const cleaned = text.trim();
    if (cleaned) return cleaned;
  } catch {
    // Fallback deterministic summary if summarization call fails
  }

  const fallbackLines = evictedMessages
    .map((m) => serializeMessageForSummary(m))
    .slice(-4);
  return [previousSummary, ...fallbackLines]
    .filter(Boolean)
    .join("\n")
    .slice(-900);
}

/**
 * Trims oldest messages from ModelMessage[] to stay under token budget while
 * preserving valid user/assistant/tool-call/tool-result pairing.
 */
function trimModelMessagesToBudget(
  modelMessages: ModelMessage[],
  budgetTokens: number,
): ModelMessage[] {
  if (modelMessages.length <= 1) return modelMessages;

  const current = [...modelMessages];
  while (
    current.length > 1 &&
    estimateModelMessagesTokens(current) > budgetTokens
  ) {
    // Drop the oldest message, and keep dropping until we land on a clean 'user' boundary
    // so we never orphan a 'tool' result or split an assistant tool-call from its tool result.
    current.shift();
    while (current.length > 1 && current[0].role !== "user") {
      current.shift();
    }
  }

  return current;
}

export function buildMemorySystemSection(
  memory: ConversationMemory,
): string | null {
  if (!memory.summary && memory.keyFacts.length === 0) {
    return null;
  }

  const lines: string[] = [
    "Memori Percakapan Terkompresi (konteks dari giliran sebelumnya untuk menghemat token):",
  ];

  if (memory.summary) {
    lines.push(memory.summary);
  }

  if (memory.keyFacts.length > 0) {
    lines.push("Fakta penting tercatat:");
    for (const fact of memory.keyFacts) {
      lines.push(`- ${fact}`);
    }
  }

  return lines.join("\n");
}

/**
 * Optimizes conversation history for long chats:
 * 1. Filters out guardrail-rejected turns.
 * 2. Incrementally compacts older messages into a rolling summary + deterministic facts.
 * 3. Prunes bulky past RAG/catalog tool outputs & reasoning via AI SDK `pruneMessages`.
 * 4. Enforces a hard token budget on the active message window.
 */
export async function prepareSmartMemoryContext<TOOLS extends ToolSet>(options: {
  messages: UIMessage[];
  previousMemory?: Partial<ConversationMemory> | null;
  orderDraft?: Partial<KonveksiOrderDraft>;
  tools: TOOLS;
}): Promise<SmartMemoryResult> {
  const { messages, previousMemory, orderDraft, tools } = options;

  const baseMemory: ConversationMemory = {
    ...createEmptyMemory(),
    ...(previousMemory ?? {}),
    keyFacts: Array.isArray(previousMemory?.keyFacts)
      ? previousMemory.keyFacts
      : [],
    stats: {
      ...createEmptyMemory().stats,
      ...(previousMemory?.stats ?? {}),
    },
  };

  const validMessages = filterValidConversationMessages(messages);
  if (validMessages.length === 0) {
    return {
      modelMessages: [],
      memoryPromptSection: buildMemorySystemSection(baseMemory),
      updatedMemory: baseMemory,
    };
  }

  // Locate watermark if the client sent the full array; if not found and
  // compactedMessageCount > 0, the client already sliced off compacted prefix.
  let uncompactedMessages = validMessages;
  let compactedPrefixTokens = baseMemory.compactedOriginalTokens;
  let compactedCount = baseMemory.compactedMessageCount;
  let lastCompactedId = baseMemory.lastCompactedMessageId;

  if (lastCompactedId) {
    const watermarkIdx = validMessages.findIndex(
      (m) => m.id === lastCompactedId,
    );
    if (watermarkIdx !== -1) {
      const alreadyCompactedPrefix = validMessages.slice(0, watermarkIdx + 1);
      compactedPrefixTokens = alreadyCompactedPrefix.reduce(
        (sum, m) => sum + estimateRawUIMessageTokens(m),
        0,
      );
      compactedCount = alreadyCompactedPrefix.length;
      uncompactedMessages = validMessages.slice(watermarkIdx + 1);
    }
  }

  let updatedSummary = baseMemory.summary;
  let windowMessages = uncompactedMessages;

  // Split uncompacted messages into [evictable older, recent active window]
  if (uncompactedMessages.length > RECENT_WINDOW_MESSAGES) {
    let splitAt = uncompactedMessages.length - RECENT_WINDOW_MESSAGES;

    // Align split boundary on a 'user' message so active window starts cleanly
    while (
      splitAt < uncompactedMessages.length - 1 &&
      uncompactedMessages[splitAt].role !== "user"
    ) {
      splitAt += 1;
    }

    if (splitAt > 0) {
      const olderSlice = uncompactedMessages.slice(0, splitAt);
      const recentSlice = uncompactedMessages.slice(splitAt);
      const olderRawTokens = olderSlice.reduce(
        (sum, m) => sum + estimateRawUIMessageTokens(m),
        0,
      );

      if (
        olderSlice.length >= COMPACT_BATCH_SIZE ||
        olderRawTokens >= COMPACT_TOKEN_THRESHOLD
      ) {
        updatedSummary = await summarizeEvictedMessages(
          updatedSummary,
          olderSlice,
        );
        compactedPrefixTokens += olderRawTokens;
        compactedCount += olderSlice.length;
        lastCompactedId = olderSlice[olderSlice.length - 1].id;
        windowMessages = recentSlice;
      } else {
        // Not enough older turns yet for an LLM summary call; strip tools to text-only
        const lightweightOlder = olderSlice
          .map(stripMessageToTextOnly)
          .filter((m): m is UIMessage => m !== null);
        windowMessages = [...lightweightOlder, ...recentSlice];
      }
    }
  }

  const updatedFacts = extractDeterministicKeyFacts(
    validMessages,
    baseMemory.keyFacts,
    orderDraft,
  );

  const clampedWindow = clampHistoricalText(windowMessages);
  const rawModelMessages = await convertToModelMessages(clampedWindow, {
    tools,
  });

  // Prune past reasoning and bulky RAG/catalog tool payloads while keeping recent quote/order context
  const prunedModelMessages = pruneMessages({
    messages: rawModelMessages,
    reasoning: "all",
    toolCalls: [
      {
        type: "before-last-message",
        tools: ["searchKnowledgeBase", "getKonveksiCatalog"],
      },
      {
        type: "before-last-3-messages",
        tools: ["calculateKonveksiQuote", "prepareKonveksiOrder"],
      },
    ],
    emptyMessages: "remove",
  });

  const budgetedModelMessages = trimModelMessagesToBudget(
    prunedModelMessages,
    MAX_ACTIVE_MODEL_TOKENS,
  );

  const uncompactedRawTokens = uncompactedMessages.reduce(
    (sum, m) => sum + estimateRawUIMessageTokens(m),
    0,
  );
  const originalEstimatedTokens = compactedPrefixTokens + uncompactedRawTokens;

  const updatedMemoryBase: ConversationMemory = {
    summary: updatedSummary,
    compactedMessageCount: compactedCount,
    lastCompactedMessageId: lastCompactedId,
    compactedOriginalTokens: compactedPrefixTokens,
    keyFacts: updatedFacts,
    stats: createEmptyMemory().stats,
  };

  const memoryPromptSection = buildMemorySystemSection(updatedMemoryBase);
  const optimizedEstimatedTokens =
    estimateModelMessagesTokens(budgetedModelMessages) +
    estimateTextTokens(memoryPromptSection ?? "");

  const updatedMemory: ConversationMemory = {
    ...updatedMemoryBase,
    stats: {
      originalEstimatedTokens,
      optimizedEstimatedTokens,
      savedTokens: Math.max(
        0,
        originalEstimatedTokens - optimizedEstimatedTokens,
      ),
      compactedTurns: Math.floor(compactedCount / 2),
      recentMessagesKept: budgetedModelMessages.length,
    },
  };

  return {
    modelMessages: budgetedModelMessages,
    memoryPromptSection,
    updatedMemory,
  };
}
