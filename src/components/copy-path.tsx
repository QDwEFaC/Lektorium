"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyPath({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className="font-mono">
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {value}
    </Button>
  );
}
