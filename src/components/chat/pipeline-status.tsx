"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import {
  BrainIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DatabaseIcon,
  ShirtIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";

interface RagMatchPreview {
  documentTitle?: string;
  similarity?: number;
}

interface PipelineStatusProps {
  parts: UIMessage["parts"];
  isStreaming: boolean;
}

function getToolLabel(toolName: string, isRunning: boolean): string {
  switch (toolName) {
    case "searchKnowledgeBase":
      return isRunning
        ? "Mencari panduan & katalog konveksi (RAG)..."
        : "Mengambil panduan & katalog konveksi (RAG)";
    case "getKonveksiCatalog":
      return isRunning
        ? "Memuat katalog produk, bahan & spesifikasi..."
        : "Memuat katalog produk, bahan & spesifikasi";
    case "calculateKonveksiQuote":
      return isRunning
        ? "Menghitung estimasi biaya & waktu produksi..."
        : "Menghitung estimasi biaya & waktu produksi";
    case "prepareKonveksiOrder":
      return isRunning
        ? "Menyiapkan form pemesanan & format WhatsApp..."
        : "Menyiapkan form pemesanan & format WhatsApp";
    default:
      return isRunning
        ? `Menjalankan tool ${toolName}...`
        : `Menjalankan tool ${toolName}`;
  }
}

function getToolIcon(toolName: string) {
  switch (toolName) {
    case "searchKnowledgeBase":
      return DatabaseIcon;
    case "getKonveksiCatalog":
      return ShirtIcon;
    case "calculateKonveksiQuote":
      return CalculatorIcon;
    case "prepareKonveksiOrder":
      return ClipboardListIcon;
    default:
      return WrenchIcon;
  }
}

export function PipelineStatus({ parts, isStreaming }: PipelineStatusProps) {
  const toolParts = parts.filter(isToolUIPart);
  const textParts = parts.filter((part) => part.type === "text");
  const hasAnyText = textParts.some((part) => part.text.trim().length > 0);
  const isTextStreaming = textParts.some((part) => part.state === "streaming");
  const anyToolRunning = toolParts.some(
    (part) =>
      part.state === "input-streaming" || part.state === "input-available"
  );

  // Only show the pipeline card if the message is currently streaming
  // or if it executed tools during generation.
  if (!isStreaming && toolParts.length === 0) {
    return null;
  }

  let activeHeadline = "Menyusun respons...";
  if (anyToolRunning) {
    const runningTool = toolParts.find(
      (part) =>
        part.state === "input-streaming" || part.state === "input-available"
    );
    activeHeadline = runningTool
      ? getToolLabel(getToolName(runningTool), true)
      : "Menjalankan tool...";
  } else if (isStreaming && !hasAnyText) {
    activeHeadline = "Menganalisis pertanyaan & merencanakan pipeline...";
  } else if (isStreaming && isTextStreaming) {
    activeHeadline = "Menulis jawaban akhir...";
  }

  return (
    <ChainOfThought
      className="rounded-lg border bg-muted/30 px-3.5 py-2.5"
      defaultOpen={isStreaming || toolParts.length > 0}
    >
      <ChainOfThoughtHeader>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Shimmer className="font-medium text-xs" duration={1.4}>
              {activeHeadline}
            </Shimmer>
          ) : (
            <span className="font-medium text-xs text-muted-foreground">
              Pipeline selesai ({toolParts.length} tool dipanggil)
            </span>
          )}
          <Badge className="h-5 px-1.5 text-[10px]" variant="outline">
            {isStreaming ? "Live" : "Done"}
          </Badge>
        </div>
      </ChainOfThoughtHeader>

      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          icon={BrainIcon}
          label={
            isStreaming && toolParts.length === 0 && !hasAnyText ? (
              <Shimmer className="text-xs font-medium" duration={1.4}>
                Menganalisis intent & memilih tools OpenAI...
              </Shimmer>
            ) : (
              "Analisis query & perencanaan langkah"
            )
          }
          status={
            isStreaming && toolParts.length === 0 && !hasAnyText
              ? "active"
              : "complete"
          }
        />

        {toolParts.map((part, idx) => {
          const toolName = getToolName(part);
          const isRunning =
            part.state === "input-streaming" ||
            part.state === "input-available";
          const isError = part.state === "output-error";
          const Icon = getToolIcon(toolName);

          const ragMatches =
            toolName === "searchKnowledgeBase" &&
            part.state === "output-available" &&
            part.output &&
            typeof part.output === "object" &&
            "matches" in part.output &&
            Array.isArray((part.output as { matches?: unknown }).matches)
              ? ((part.output as { matches: RagMatchPreview[] }).matches ?? [])
              : [];

          return (
            <ChainOfThoughtStep
              description={
                isError
                  ? part.errorText || "Tool gagal dieksekusi"
                  : undefined
              }
              icon={Icon}
              key={`${part.toolCallId}-${idx}`}
              label={
                isRunning ? (
                  <Shimmer className="text-xs font-medium" duration={1.4}>
                    {getToolLabel(toolName, true)}
                  </Shimmer>
                ) : (
                  getToolLabel(toolName, false)
                )
              }
              status={isRunning ? "active" : "complete"}
            >
              {ragMatches.length > 0 && (
                <ChainOfThoughtSearchResults>
                  {ragMatches.map((match, matchIdx) => (
                    <ChainOfThoughtSearchResult key={matchIdx}>
                      {match.documentTitle || "Dokumen"}
                      {typeof match.similarity === "number" && (
                        <span className="text-muted-foreground">
                          ({Math.round(match.similarity * 100)}%)
                        </span>
                      )}
                    </ChainOfThoughtSearchResult>
                  ))}
                </ChainOfThoughtSearchResults>
              )}
            </ChainOfThoughtStep>
          );
        })}

        {(hasAnyText || !isStreaming) && (
          <ChainOfThoughtStep
            icon={isStreaming ? SparklesIcon : CheckCircle2Icon}
            label={
              isStreaming ? (
                <Shimmer className="text-xs font-medium" duration={1.4}>
                  Mensintesis jawaban dari konteks & hasil tool...
                </Shimmer>
              ) : (
                "Respons akhir selesai disintesis"
              )
            }
            status={isStreaming ? "active" : "complete"}
          />
        )}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
