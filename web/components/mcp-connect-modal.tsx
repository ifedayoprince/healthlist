"use client";

import { useState } from "react";
import { MCP_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  Button,
  Modal,
} from "./ui";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  LinkIcon,
  LockIcon,
} from "./icons";

const ASSISTANTS = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    steps: [
      "Open ChatGPT, then go to Settings → Apps & connectors.",
      "Turn on Developer mode and choose Create connector.",
      "Paste the Healthlist MCP URL and save the connector.",
      "In a new chat, ask: “Find me a GLP-1 product on Healthlist.”",
    ],
  },
  {
    id: "claude",
    label: "Claude",
    steps: [
      "Open Claude, then go to Settings → Connectors.",
      "Choose Add custom connector.",
      "Paste the Healthlist MCP URL and confirm.",
      "Ask Claude to search the Healthlist marketplace for you.",
    ],
  },
  {
    id: "other",
    label: "Other",
    steps: [
      "Open the MCP or connector settings in your assistant.",
      "Choose Add remote MCP server.",
      "Paste the Healthlist MCP URL and save.",
      "Start a chat and ask your assistant to search Healthlist.",
    ],
  },
] as const;

type AssistantId = (typeof ASSISTANTS)[number]["id"];

export function McpConnectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [active, setActive] = useState<AssistantId>("chatgpt");
  const [copied, setCopied] = useState(false);

  const assistant =
    ASSISTANTS.find((item) => item.id === active) ?? ASSISTANTS[0];

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="mcp-modal-title"
      className="sm:max-w-[600px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Assistant setup
          </p>
          <h2
            id="mcp-modal-title"
            className="mt-2 font-serif text-[34px] leading-[1.1] sm:text-[38px]"
          >
            Connect your assistant
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-[#f2f4f5] hover:text-foreground"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Healthlist works inside ChatGPT, Claude, and any assistant that supports
        MCP connectors. Add this URL once — your assistant can then search the
        marketplace and create intake requests for you.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-[18px] bg-[#f3f6f7] p-2 pl-4">
        <LinkIcon className="size-5 shrink-0 text-brand" />
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-[#39474a]">
          {MCP_URL}
        </code>
        <Button
          size="sm"
          variant={copied ? "soft" : "primary"}
          onClick={copyUrl}
          className="shrink-0"
        >
          {copied ? (
            <>
              <CheckIcon className="size-4" /> Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-4" /> Copy
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 flex gap-1 rounded-full bg-[#f3f5f6] p-1">
        {ASSISTANTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
              active === item.id
                ? "bg-white text-foreground shadow-[0_1px_2px_rgba(16,34,37,0.12)]"
                : "text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ol className="mt-6 space-y-4">
        {assistant.steps.map((step, index) => (
          <li key={step} className="flex gap-3.5">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mint-soft text-[11px] font-semibold text-brand">
              {index + 1}
            </span>
            <p className="text-[15px] leading-relaxed text-[#3c4346]">{step}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex gap-3 rounded-[16px] bg-[#f4fafb] p-4 text-[13px] leading-relaxed text-[#2c656d]">
        <LockIcon className="mt-0.5 size-4 shrink-0" />
        <p>
          Your health details never pass through your assistant. Reviews,
          assessments, and payment details stay here on Healthlist.
        </p>
      </div>

      <Button size="lg" className="mt-6 w-full" onClick={onClose}>
        Done
      </Button>
      <p className="mt-3 text-center text-xs text-muted">
        Menu names vary slightly between assistants and app versions.
      </p>
    </Modal>
  );
}
