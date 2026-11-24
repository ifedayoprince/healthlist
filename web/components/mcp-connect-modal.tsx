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
    id: "claude",
    label: "Claude",
    steps: [
      "Open Claude and go to Settings → Connectors (claude.ai/customize/connectors).",
      "Select + Add → Add custom connector.",
      "Name it Healthlist and paste the MCP URL above.",
      "Select Continue. When Claude checks authentication, choose No sign in — Healthlist needs no credentials.",
      "Select Add. Then open a new chat, choose + → Connectors, and enable Healthlist.",
      "Ask: “Find me sleep products on Healthlist.”",
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    steps: [
      "Open ChatGPT on the web and go to Plugins.",
      "Select + → Add custom MCP server.",
      "Name it Healthlist and paste the MCP URL above.",
      "Healthlist needs no authentication — leave credentials blank if asked.",
      "Acknowledge the security warning and select Create as a plugin.",
      "Review the discovered tools and install the plugin.",
      "In a chat, type @, select Healthlist, and ask it to search the marketplace.",
    ],
  },
  {
    id: "other",
    label: "Other",
    note: "Any client that supports remote MCP over Streamable HTTP will work.",
    steps: [
      "Open the MCP or connector settings in your assistant.",
      "Add a remote MCP server over Streamable HTTP.",
      "Paste the Healthlist MCP URL. No API key or OAuth is required.",
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
  const [active, setActive] = useState<AssistantId>("claude");
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
      className="sm:max-w-[640px]"
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
        Healthlist works inside Claude, ChatGPT, and any assistant that supports
        MCP connectors. The endpoint is public: add the URL once and your
        assistant can search the marketplace and create intake requests for you.
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

      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
        <span className="size-1.5 rounded-full bg-brand" />
        Public MCP endpoint — no sign-in or API key required.
      </p>

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

      {"note" in assistant && assistant.note ? (
        <div className="mt-4 rounded-[14px] border border-[#eadfc9] bg-[#fffaf0] px-4 py-3 text-[12.5px] leading-relaxed text-[#7b6539]">
          {assistant.note}
        </div>
      ) : null}

      <ol className="mt-5 space-y-4">
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
