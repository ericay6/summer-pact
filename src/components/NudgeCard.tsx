"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/Button";

export function NudgeCard({
  message,
  onCopied,
}: {
  message: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // clipboard may be blocked; still flip the UI state.
    }
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card card-pad flex items-start justify-between gap-3">
      <p className="text-sm text-ink/80">{message}</p>
      <Button
        size="sm"
        variant={copied ? "lagoon" : "secondary"}
        onClick={copy}
        className="shrink-0"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
