"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConversationMemory } from "@/lib/ai/memory";
import type { KonveksiOrderDraft, QuoteResult } from "@/lib/konveksi/catalog";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import {
  BotIcon,
  BrainIcon,
  CheckIcon,
  CopyIcon,
  CpuIcon,
  MinusIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { QuoteBreakdownCard, WhatsAppOrderButtonCard } from "./konveksi-cards";
import { PipelineStatus } from "./pipeline-status";

interface HealthStatus {
  openaiConfigured: boolean;
  pineconeConfigured: boolean;
  vectorProvider: "pinecone" | "local";
  pineconeIndex: string | null;
  pineconeNamespace: string | null;
  defaultChatModel: string;
  embeddingModel: string;
  konveksiBrandName?: string;
  konveksiCity?: string;
  konveksiWhatsapp?: string;
}

export interface ChatWorkspaceProps {
  /** Minimize/close handler when used inside a floating container */
  onClose?: () => void;
  /** Custom header title */
  title?: string;
  /** Custom header subtitle */
  subtitle?: string;
  /** Custom composer placeholder */
  placeholder?: string;
  /** Custom starter suggestions */
  suggestions?: string[];
  /** Custom chat API endpoint */
  apiEndpoint?: string;
  /** Custom health API endpoint */
  healthEndpoint?: string;
  /** Optional wrapper class name */
  className?: string;
}

const STARTER_SUGGESTIONS = [
  "Produk konveksi apa saja yang bisa dibuat dan berapa minimal ordernya?",
  "Apa pilihan bahan kain terbaik untuk kaos komunitas & kemeja PDH?",
  "Hitung estimasi 50 pcs kaos Combed 24s sablon DTF (ada 5 ukuran XXL)",
  "Saya mau pesan 30 pcs kemeja PDH American Drill bordir logo, bantu order ke WA",
];

interface ExtractedSource {
  id: string;
  title: string;
  href: string;
}

function extractRagSources(message: UIMessage): ExtractedSource[] {
  const seen = new Map<string, ExtractedSource>();

  for (const part of message.parts) {
    if (part.type === "source-url") {
      seen.set(part.url, {
        id: part.sourceId,
        title: part.title || part.url,
        href: part.url,
      });
    } else if (part.type === "source-document") {
      const key = part.filename || part.title || part.sourceId;
      seen.set(key, {
        id: part.sourceId,
        title: part.title || part.filename || "Dokumen",
        href: `#source-${part.sourceId}`,
      });
    } else if (
      part.type === "tool-searchKnowledgeBase" &&
      part.state === "output-available" &&
      part.output &&
      typeof part.output === "object" &&
      "matches" in part.output &&
      Array.isArray((part.output as { matches?: unknown }).matches)
    ) {
      const matches = (
        part.output as {
          matches: Array<{
            documentId?: string;
            documentTitle?: string;
            source?: string;
          }>;
        }
      ).matches;

      for (const match of matches) {
        const title = match.documentTitle || "Knowledge Base Document";
        const key = match.documentId || title;
        if (!seen.has(key)) {
          seen.set(key, {
            id: key,
            title,
            href: match.source?.startsWith("http")
              ? match.source
              : `#doc-${key}`,
          });
        }
      }
    }
  }

  return Array.from(seen.values());
}

const CHAT_HISTORY_STORAGE_KEY = "ken-konveksi:chat-history:v1";
const ORDER_DRAFT_STORAGE_KEY = "ken-konveksi:order-draft:v1";
const MEMORY_STATE_STORAGE_KEY = "ken-konveksi:memory-state:v1";

const MEMORY_STORE_EVENT = "ken-konveksi:memory-store-change";
let cachedMemoryRaw: string | null | undefined;
let cachedMemorySnapshot: ConversationMemory | null = null;

function readStoredMemoryState(): ConversationMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMORY_STATE_STORAGE_KEY);
    if (raw === cachedMemoryRaw) {
      return cachedMemorySnapshot;
    }
    cachedMemoryRaw = raw;
    if (!raw) {
      cachedMemorySnapshot = null;
      return null;
    }
    const parsed = JSON.parse(raw) as ConversationMemory;
    cachedMemorySnapshot = parsed && typeof parsed === "object" ? parsed : null;
    return cachedMemorySnapshot;
  } catch {
    return null;
  }
}

function writeStoredMemoryState(memory: ConversationMemory | null): void {
  if (typeof window === "undefined") return;
  try {
    if (memory) {
      const serialized = JSON.stringify(memory);
      window.localStorage.setItem(MEMORY_STATE_STORAGE_KEY, serialized);
      cachedMemoryRaw = serialized;
      cachedMemorySnapshot = memory;
    } else {
      window.localStorage.removeItem(MEMORY_STATE_STORAGE_KEY);
      cachedMemoryRaw = null;
      cachedMemorySnapshot = null;
    }
    window.dispatchEvent(new Event(MEMORY_STORE_EVENT));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

function subscribeMemoryStore(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(MEMORY_STORE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(MEMORY_STORE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getServerMemorySnapshot(): ConversationMemory | null {
  return null;
}

function filterValidMessagesForWire(messages: UIMessage[]): UIMessage[] {
  const valid: UIMessage[] = [];
  for (const msg of messages) {
    const meta = msg.metadata as { guardrailRejected?: boolean } | undefined;
    if (msg.role === "assistant" && meta?.guardrailRejected) {
      if (valid.length > 0 && valid[valid.length - 1].role === "user") {
        valid.pop();
      }
      continue;
    }
    valid.push(msg);
  }
  return valid;
}

function formatCompactTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

function readStoredOrderDraft(): Partial<KonveksiOrderDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<KonveksiOrderDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mergeOrderDraft(
  base: Partial<KonveksiOrderDraft>,
  incoming: Partial<KonveksiOrderDraft>,
): Partial<KonveksiOrderDraft> {
  const merged: Partial<KonveksiOrderDraft> = { ...base };
  for (const [key, value] of Object.entries(incoming) as Array<
    [keyof KonveksiOrderDraft, KonveksiOrderDraft[keyof KonveksiOrderDraft]]
  >) {
    if (typeof value === "number") {
      if (value > 0) {
        (merged as Record<string, unknown>)[key] = value;
      }
    } else if (typeof value === "string") {
      if (value.trim()) {
        (merged as Record<string, unknown>)[key] = value.trim();
      }
    }
  }
  return merged;
}

function extractOrderDraftFromMessages(
  messages: UIMessage[],
): Partial<KonveksiOrderDraft> {
  let extracted: Partial<KonveksiOrderDraft> = {};
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      if (
        part.type === "tool-calculateKonveksiQuote" &&
        part.output &&
        typeof part.output === "object"
      ) {
        const quote = part.output as QuoteResult;
        extracted = mergeOrderDraft(extracted, {
          productName: quote.productName,
          fabricName: quote.fabricName,
          printMethod: quote.printMethodName,
          quantity: quote.quantity,
          sizeBreakdownText: quote.sizeBreakdownSummary,
          estimatedTotal: quote.totalPrice,
          estimatedDp: quote.dpAmount,
          estimatedDays: `${quote.estimatedDaysMin}–${quote.estimatedDaysMax} hari kerja`,
        });
      } else if (
        part.type === "tool-prepareKonveksiOrder" &&
        part.output &&
        typeof part.output === "object" &&
        "orderDraft" in part.output
      ) {
        const payload = part.output as {
          orderDraft?: Partial<KonveksiOrderDraft>;
        };
        if (payload.orderDraft) {
          extracted = mergeOrderDraft(extracted, payload.orderDraft);
        }
      }
    }
  }
  return extracted;
}

function getMessagePlainText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function ChatWorkspace({
  onClose,
  title,
  subtitle,
  placeholder,
  suggestions = STARTER_SUGGESTIONS,
  apiEndpoint = "/api/chat",
  healthEndpoint = "/api/health",
  className,
}: ChatWorkspaceProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const memoryState = useSyncExternalStore(
    subscribeMemoryStore,
    readStoredMemoryState,
    getServerMemorySnapshot,
  );
  const hasHydratedRef = useRef(false);
  const expectingHydratedMessagesRef = useRef(false);
  const orderDraftRef = useRef<Partial<KonveksiOrderDraft>>({});

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        prepareSendMessagesRequest: ({
          id,
          messages: outgoingMessages,
          body,
          trigger,
          messageId,
        }) => {
          const currentMemory = readStoredMemoryState();
          const validMessages = filterValidMessagesForWire(outgoingMessages);
          let wireMessages = validMessages;

          if (currentMemory?.lastCompactedMessageId) {
            const idx = validMessages.findIndex(
              (m) => m.id === currentMemory.lastCompactedMessageId,
            );
            if (idx !== -1 && idx < validMessages.length - 1) {
              wireMessages = validMessages.slice(idx + 1);
            }
          }

          return {
            body: {
              ...body,
              id,
              trigger,
              messageId,
              messages: wireMessages,
              orderDraft: readStoredOrderDraft(),
              memoryState: currentMemory,
            },
          };
        },
      }),
    [apiEndpoint],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
    clearError,
  } = useChat({
    transport,
    onData: (dataPart) => {
      if (
        dataPart.type === "data-memory" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        writeStoredMemoryState(dataPart.data as ConversationMemory);
      }
    },
  });

  useEffect(() => {
    let hydratedWithMessages = false;
    try {
      const savedDraftRaw = window.localStorage.getItem(
        ORDER_DRAFT_STORAGE_KEY,
      );
      if (savedDraftRaw) {
        const parsedDraft = JSON.parse(
          savedDraftRaw,
        ) as Partial<KonveksiOrderDraft>;
        if (parsedDraft && typeof parsedDraft === "object") {
          orderDraftRef.current = parsedDraft;
        }
      }

      const savedHistoryRaw = window.localStorage.getItem(
        CHAT_HISTORY_STORAGE_KEY,
      );
      if (savedHistoryRaw) {
        const parsedHistory = JSON.parse(savedHistoryRaw) as UIMessage[];
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          hydratedWithMessages = true;
          expectingHydratedMessagesRef.current = true;
          setMessages(parsedHistory);
        }
      }
    } catch {
      // Ignore malformed localStorage data or unavailable storage
    } finally {
      if (!hydratedWithMessages) {
        hasHydratedRef.current = true;
      }
    }
  }, [setMessages]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      if (expectingHydratedMessagesRef.current && messages.length > 0) {
        hasHydratedRef.current = true;
        expectingHydratedMessagesRef.current = false;
      } else {
        return;
      }
    }
    if (status === "streaming") return;

    try {
      if (messages.length > 0) {
        window.localStorage.setItem(
          CHAT_HISTORY_STORAGE_KEY,
          JSON.stringify(messages),
        );
      } else {
        window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      }

      const extracted = extractOrderDraftFromMessages(messages);
      const merged = mergeOrderDraft(orderDraftRef.current, extracted);
      orderDraftRef.current = merged;
      if (Object.keys(merged).length > 0) {
        window.localStorage.setItem(
          ORDER_DRAFT_STORAGE_KEY,
          JSON.stringify(merged),
        );
      }
    } catch {
      // Ignore storage quota or private mode errors
    }
  }, [messages, status]);

  useEffect(() => {
    let active = true;
    fetch(healthEndpoint)
      .then((res) => res.json())
      .then((data: HealthStatus) => {
        if (!active) return;
        setHealth(data);
      })
      .catch(() => {
        if (active) setHealth(null);
      });
    return () => {
      active = false;
    };
  }, [healthEndpoint]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      clearError();
      await sendMessage({ text: trimmed });
    },
    [clearError, isBusy, sendMessage],
  );

  const handleCopy = useCallback(async (message: UIMessage) => {
    const text = getMessagePlainText(message);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const lastMessage = messages.at(-1);
  const showSubmittedPipeline =
    status === "submitted" && (!lastMessage || lastMessage.role === "user");

  const konveksiName = health?.konveksiBrandName || "Ken Konveksi";
  const resolvedTitle = title ?? konveksiName;
  const resolvedSubtitle =
    subtitle ?? "Konsultasi Produk, Bahan, Hitung Order & WA";
  const resolvedPlaceholder =
    placeholder ?? "Tanya produk, bahan, estimasi harga, atau buat pesanan...";

  return (
    <div
      className={cn(
        "relative flex h-full w-full overflow-hidden bg-background",
        className,
      )}
    >
      {/* Main Chat Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b bg-muted/30 px-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SparklesIcon className="size-4" />
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-semibold text-sm">
                  {resolvedTitle}
                </h1>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {memoryState &&
              (memoryState.stats.savedTokens > 0 ||
                memoryState.stats.compactedTurns > 0) && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Badge
                        className="hidden h-6 gap-1 px-2 text-[10px] font-medium sm:inline-flex"
                        variant="secondary"
                      />
                    }
                  >
                    <CpuIcon className="size-3 text-emerald-600" />
                    <span>
                      Hemat ~
                      {formatCompactTokens(memoryState.stats.savedTokens)} token
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Smart Memory aktif: {memoryState.stats.compactedTurns}{" "}
                    giliran dipadatkan, {memoryState.stats.recentMessagesKept}{" "}
                    pesan aktif dikirim (~
                    {formatCompactTokens(
                      memoryState.stats.optimizedEstimatedTokens,
                    )}{" "}
                    vs ~
                    {formatCompactTokens(
                      memoryState.stats.originalEstimatedTokens,
                    )}{" "}
                    token).
                  </TooltipContent>
                </Tooltip>
              )}

            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Reset percakapan"
                      onClick={() => {
                        stop();
                        setMessages([]);
                        orderDraftRef.current = {};
                        writeStoredMemoryState(null);
                        try {
                          window.localStorage.removeItem(
                            CHAT_HISTORY_STORAGE_KEY,
                          );
                          window.localStorage.removeItem(
                            ORDER_DRAFT_STORAGE_KEY,
                          );
                        } catch {
                          // Ignore storage errors
                        }
                        clearError();
                      }}
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <Trash2Icon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>Reset percakapan</TooltipContent>
              </Tooltip>
            )}

            {onClose && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Perkecil assistant"
                      onClick={onClose}
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <MinusIcon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Perkecil</TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        {/* Conversation Area */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Conversation className="flex-1">
            {messages.length > 0 && (
              <ConversationDownload
                className="top-2.5 right-2.5 z-10 size-7"
                filename="ai-chat-export.md"
                messages={messages}
              />
            )}

            <ConversationContent className="mx-auto w-full gap-5 px-3 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <ConversationEmptyState
                    className="h-auto p-2"
                    description="Tanya produk, bahan, estimasi harga, atau order WA."
                    icon={<BotIcon className="size-7 opacity-70" />}
                    title={`Halo! Tanya ${konveksiName}`}
                  />

                  {suggestions.length > 0 && (
                    <div className="flex w-full flex-col gap-1.5">
                      {suggestions.map((item) => (
                        <Suggestion
                          className="h-auto w-full justify-start whitespace-normal rounded-xl px-3 py-2 text-left text-xs leading-relaxed"
                          key={item}
                          onClick={(s) => void handleSend(s)}
                          suggestion={item}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message, index) => {
                  const isLastMessage = index === messages.length - 1;
                  const isAssistantStreaming =
                    isLastMessage && message.role === "assistant" && isBusy;
                  const sources =
                    message.role === "assistant"
                      ? extractRagSources(message)
                      : [];
                  const isGuardrailRejected = Boolean(
                    message.role === "assistant" &&
                    (
                      message.metadata as
                        | { guardrailRejected?: boolean }
                        | undefined
                    )?.guardrailRejected,
                  );

                  return (
                    <Message from={message.role} key={message.id}>
                      <MessageContent className="w-full">
                        {isGuardrailRejected && (
                          <div className="mb-1 flex items-center gap-1.5">
                            <Badge
                              className="gap-1 border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                              variant="outline"
                            >
                              <ShieldAlertIcon className="size-3" />
                              Di luar topik Konveksi
                            </Badge>
                          </div>
                        )}

                        {message.role === "assistant" && (
                          <PipelineStatus
                            isStreaming={isAssistantStreaming}
                            parts={message.parts}
                          />
                        )}

                        {message.parts.map((part, partIdx) => {
                          if (part.type === "reasoning") {
                            return (
                              <Reasoning
                                isStreaming={part.state === "streaming"}
                                key={`reasoning-${partIdx}`}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          }

                          if (isToolUIPart(part)) {
                            const isPending =
                              part.state === "input-streaming" ||
                              part.state === "input-available";
                            const isError = part.state === "output-error";

                            const quoteOutput =
                              part.type === "tool-calculateKonveksiQuote" &&
                              part.state === "output-available" &&
                              part.output &&
                              typeof part.output === "object"
                                ? (part.output as QuoteResult)
                                : null;

                            const orderOutput =
                              part.type === "tool-prepareKonveksiOrder" &&
                              part.state === "output-available" &&
                              part.output &&
                              typeof part.output === "object" &&
                              "orderDraft" in part.output
                                ? (part.output as {
                                    brandName?: string;
                                    adminWhatsapp?: string;
                                    readyToSend?: boolean;
                                    whatsappMessage?: string | null;
                                    whatsappUrl?: string | null;
                                    orderDraft: KonveksiOrderDraft;
                                  })
                                : null;

                            return (
                              <div
                                className="space-y-2"
                                key={`${part.toolCallId}-${partIdx}`}
                              >
                                <Tool defaultOpen={isPending || isError}>
                                  {part.type === "dynamic-tool" ? (
                                    <ToolHeader
                                      state={part.state}
                                      toolName={part.toolName}
                                      type="dynamic-tool"
                                    />
                                  ) : (
                                    <ToolHeader
                                      state={part.state}
                                      type={part.type}
                                    />
                                  )}
                                  <ToolContent>
                                    <ToolInput input={part.input} />
                                    <ToolOutput
                                      errorText={part.errorText}
                                      output={part.output}
                                    />
                                  </ToolContent>
                                </Tool>

                                {quoteOutput && (
                                  <QuoteBreakdownCard
                                    disabled={isBusy}
                                    onContinueToOrder={(q) => {
                                      const specParts = [
                                        `${q.quantity} pcs ${q.productName}`,
                                        `bahan ${q.fabricName}`,
                                        q.printMethodName,
                                        q.longSleeve ? "lengan panjang" : null,
                                        q.zipper ? "pakai resleting" : null,
                                        q.sizeBreakdownSummary
                                          ? `ukuran (${q.sizeBreakdownSummary})`
                                          : null,
                                        `estimasi total Rp ${q.totalPrice.toLocaleString("id-ID")}`,
                                      ]
                                        .filter(Boolean)
                                        .join(", ");
                                      void handleSend(
                                        `Saya setuju dengan estimasi tersebut (${specParts}). Tolong lanjutkan pemesanan dan tanyakan data yang masih diperlukan untuk Order ke WA.`,
                                      );
                                    }}
                                    quote={quoteOutput}
                                  />
                                )}

                                {orderOutput?.readyToSend &&
                                  orderOutput.whatsappUrl && (
                                    <WhatsAppOrderButtonCard
                                      adminWhatsapp={
                                        orderOutput.adminWhatsapp ||
                                        health?.konveksiWhatsapp
                                      }
                                      brandName={
                                        orderOutput.brandName || konveksiName
                                      }
                                      orderDraft={orderOutput.orderDraft}
                                      whatsappMessage={
                                        orderOutput.whatsappMessage
                                      }
                                      whatsappUrl={orderOutput.whatsappUrl}
                                    />
                                  )}
                              </div>
                            );
                          }

                          if (part.type === "text") {
                            if (message.role === "user") {
                              return (
                                <p
                                  className="whitespace-pre-wrap text-sm leading-relaxed"
                                  key={`text-${partIdx}`}
                                >
                                  {part.text}
                                </p>
                              );
                            }

                            return (
                              <MessageResponse
                                isAnimating={
                                  isAssistantStreaming &&
                                  part.state === "streaming"
                                }
                                key={`text-${partIdx}`}
                              >
                                {part.text}
                              </MessageResponse>
                            );
                          }

                          return null;
                        })}

                        {sources.length > 0 && (
                          <Sources className="mt-2 mb-0">
                            <SourcesTrigger count={sources.length} />
                            <SourcesContent>
                              {sources.map((src) => (
                                <Source
                                  href={src.href}
                                  key={src.id}
                                  title={src.title}
                                />
                              ))}
                            </SourcesContent>
                          </Sources>
                        )}
                      </MessageContent>

                      {message.role === "assistant" &&
                        !isAssistantStreaming && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => void handleCopy(message)}
                              tooltip="Salin jawaban"
                            >
                              {copiedId === message.id ? (
                                <CheckIcon className="size-3.5 text-emerald-600" />
                              ) : (
                                <CopyIcon className="size-3.5" />
                              )}
                            </MessageAction>
                            {isLastMessage && !isGuardrailRejected && (
                              <MessageAction
                                onClick={() => void regenerate()}
                                tooltip="Generate ulang"
                              >
                                <RotateCcwIcon className="size-3.5" />
                              </MessageAction>
                            )}
                          </MessageActions>
                        )}
                    </Message>
                  );
                })
              )}

              {/* Initial pipeline state right after user submits */}
              {showSubmittedPipeline && (
                <Message from="assistant">
                  <MessageContent className="w-full">
                    <ChainOfThought
                      className="rounded-lg border bg-muted/30 px-3.5 py-2.5"
                      defaultOpen
                    >
                      <ChainOfThoughtHeader>
                        <div className="flex items-center gap-2">
                          <Shimmer
                            className="font-medium text-xs"
                            duration={1.2}
                          >
                            Memulai pipeline OpenAI...
                          </Shimmer>
                          <Badge
                            className="h-5 px-1.5 text-[10px]"
                            variant="outline"
                          >
                            Live
                          </Badge>
                        </div>
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                          icon={BrainIcon}
                          label={
                            <Shimmer
                              className="text-xs font-medium"
                              duration={1.2}
                            >
                              Menganalisis prompt & menyiapkan tools...
                            </Shimmer>
                          }
                          status="active"
                        />
                      </ChainOfThoughtContent>
                    </ChainOfThought>
                  </MessageContent>
                </Message>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  <p className="font-medium">
                    Terjadi kesalahan pada pipeline AI:
                  </p>
                  <p className="mt-1 opacity-90">{error.message}</p>
                </div>
              )}
            </ConversationContent>

            <ConversationScrollButton />
          </Conversation>

          {/* Bottom Composer */}
          <div className="shrink-0 border-t bg-background/95 px-3 py-2.5 backdrop-blur">
            <div className="mx-auto">
              <PromptInput
                onSubmit={async ({ text }) => {
                  await handleSend(text);
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-10 text-xs"
                    disabled={status === "submitted"}
                    placeholder={resolvedPlaceholder}
                  />
                </PromptInputBody>

                <PromptInputFooter>
                  <PromptInputSubmit
                    className={"ml-auto"}
                    onStop={stop}
                    status={status}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
