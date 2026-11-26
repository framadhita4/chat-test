"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  Code2Icon,
  CopyIcon,
  LayoutGridIcon,
  MessageSquareIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { FloatingChatWidget } from "./floating-chat-widget";

type IntegrationTab = "react" | "script" | "iframe";

const INTEGRATION_SNIPPETS: Record<
  IntegrationTab,
  { label: string; description: string; code: string }
> = {
  react: {
    label: "Next.js / React",
    description:
      "Pasang komponen <FloatingChatWidget /> di layout.tsx atau page.tsx mana saja.",
    code: `import { FloatingChatWidget } from "@/components/chat/floating-chat-widget";

export default function ExistingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingChatWidget
        launcherLabel="Tanya AI"
        title="AI Assistant"
      />
    </>
  );
}`,
  },
  script: {
    label: "HTML / Web Lain (Script)",
    description:
      "Tempel 1 tag <script> sebelum </body> di HTML, Laravel, WordPress, atau web statis.",
    code: `<script
  src="http://localhost:3000/widget.js"
  data-title="AI Assistant"
  data-label="Tanya AI"
  data-position="bottom-right"
  defer
></script>`,
  },
  iframe: {
    label: "Iframe (/embed)",
    description:
      "Gunakan route /embed untuk menyematkan UI chat ringkas di container atau modal existing.",
    code: `<iframe
  src="http://localhost:3000/embed"
  title="AI Assistant"
  style="width: 410px; height: 600px; border: 0; border-radius: 16px;"
></iframe>`,
  },
};

function HostPagePreview({
  floatingOpen,
  onToggleFloating,
}: {
  floatingOpen: boolean;
  onToggleFloating: () => void;
}) {
  const [activeTab, setActiveTab] = useState<IntegrationTab>("react");
  const [copied, setCopied] = useState(false);

  const snippet = INTEGRATION_SNIPPETS[activeTab];

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [snippet.code]);

  return (
    <div className="min-h-dvh bg-muted/20 text-foreground">
      {/* Simulated Existing Web Page Navbar */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutGridIcon className="size-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                Sample Existing Web Page
              </span>
              <Badge className="hidden sm:inline-flex" variant="secondary">
                Floating Preview
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onToggleFloating} size="sm" variant="outline">
              <MessageSquareIcon className="mr-1.5 size-3.5" />
              {floatingOpen ? "Perkecil Widget" : "Buka Widget"}
            </Button>
          </div>
        </div>
      </header>

      {/* Sample Web Content + Integration Guide */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 pb-28 sm:px-6">
        <section className="rounded-2xl border bg-background p-6 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2Icon className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Cara Integrasi ke Halaman Web Anda
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(INTEGRATION_SNIPPETS) as IntegrationTab[]).map(
                (tab) => (
                  <Button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCopied(false);
                    }}
                    size="xs"
                    variant={activeTab === tab ? "default" : "outline"}
                  >
                    {INTEGRATION_SNIPPETS[tab].label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            {snippet.description}
          </p>

          <div className="relative overflow-hidden rounded-xl border bg-muted/40">
            <Button
              aria-label="Salin kode integrasi"
              className="absolute top-2.5 right-2.5"
              onClick={() => void handleCopy()}
              size="xs"
              variant="secondary"
            >
              {copied ? (
                <>
                  <CheckIcon className="mr-1 size-3 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <CopyIcon className="mr-1 size-3" />
                  Salin
                </>
              )}
            </Button>
            <pre className="overflow-x-auto p-4 pr-20 font-mono text-xs leading-relaxed">
              <code>{snippet.code}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Root client shell for "/" rendering the host page preview with the floating AI assistant widget.
 */
export function ChatPageClient() {
  const [floatingOpen, setFloatingOpen] = useState(true);

  return (
    <div className="relative min-h-dvh w-full">
      <HostPagePreview
        floatingOpen={floatingOpen}
        onToggleFloating={() => setFloatingOpen((prev) => !prev)}
      />

      <FloatingChatWidget
        launcherLabel="Tanya Konveksi"
        onOpenChange={setFloatingOpen}
        open={floatingOpen}
        position="bottom-right"
      />
    </div>
  );
}
