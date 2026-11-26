"use client";

import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MessageSquareIcon, SparklesIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ChatWorkspace, type ChatWorkspaceProps } from "./chat-workspace";

export type FloatingPosition = "bottom-right" | "bottom-left";

interface FloatingLauncherButtonProps {
  isOpen: boolean;
  onClick: () => void;
  position?: FloatingPosition;
  label?: string;
  className?: string;
}

/**
 * Floating action button anchored at the bottom corner to open or minimize the AI assistant.
 */
export function FloatingLauncherButton({
  isOpen,
  onClick,
  position = "bottom-right",
  label,
  className,
}: FloatingLauncherButtonProps) {
  const isLeft = position === "bottom-left";

  return (
    <Button
      aria-expanded={isOpen}
      aria-label={isOpen ? "Tutup asisten AI" : label || "Buka asisten AI"}
      className={cn(
        "fixed bottom-5 z-40 h-12 rounded-full shadow-lg ring-1 ring-black/10 transition-all duration-200 hover:scale-105 active:scale-95 dark:ring-white/15",
        isLeft ? "left-5" : "right-5",
        label && !isOpen ? "gap-2 px-4" : "w-12 px-0",
        className
      )}
      onClick={onClick}
      type="button"
    >
      {isOpen ? (
        <XIcon className="size-5" />
      ) : (
        <>
          <span className="relative flex items-center justify-center">
            {label ? (
              <MessageSquareIcon className="size-4.5" />
            ) : (
              <SparklesIcon className="size-5" />
            )}
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-primary bg-emerald-400"
            />
          </span>
          {label && <span className="font-medium text-sm">{label}</span>}
        </>
      )}
    </Button>
  );
}

/**
 * Shared responsive positioning and transition classes for the floating chat card.
 */
export function getFloatingPanelClassName(
  isOpen: boolean,
  position: FloatingPosition = "bottom-right"
) {
  const isLeft = position === "bottom-left";

  return cn(
    "fixed inset-x-3 bottom-20 z-40 h-[min(620px,calc(100dvh-6.5rem))] overflow-hidden rounded-2xl border bg-background shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out dark:ring-white/10",
    isLeft
      ? "origin-bottom-left sm:right-auto sm:left-5 sm:w-[410px]"
      : "origin-bottom-right sm:left-auto sm:right-5 sm:w-[410px]",
    isOpen
      ? "visible translate-y-0 scale-100 opacity-100"
      : "pointer-events-none invisible translate-y-3 scale-95 opacity-0"
  );
}

export interface FloatingChatWidgetProps
  extends Omit<ChatWorkspaceProps, "onClose"> {
  /** Initial open state when uncontrolled (default: false) */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open change handler */
  onOpenChange?: (open: boolean) => void;
  /** Corner anchor position (default: "bottom-right") */
  position?: FloatingPosition;
  /** Optional pill label shown next to the launcher icon (e.g. "Tanya AI") */
  launcherLabel?: string;
  /** Custom class name for the floating card container */
  panelClassName?: string;
}

/**
 * Drop-in floating AI assistant widget for integrating into any existing React/Next.js page.
 */
export function FloatingChatWidget({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  position = "bottom-right",
  launcherLabel,
  panelClassName,
  ...chatProps
}: FloatingChatWidgetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setIsOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(isOpen) : next;
      if (!isControlled) {
        setUncontrolledOpen(resolved);
      }
      onOpenChange?.(resolved);
    },
    [isControlled, isOpen, onOpenChange]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <TooltipProvider>
      <div
        aria-hidden={!isOpen}
        className={cn(getFloatingPanelClassName(isOpen, position), panelClassName)}
        inert={!isOpen || undefined}
      >
        <ChatWorkspace
          {...chatProps}
          onClose={() => setIsOpen(false)}
        />
      </div>

      <FloatingLauncherButton
        isOpen={isOpen}
        label={launcherLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        position={position}
      />
    </TooltipProvider>
  );
}
