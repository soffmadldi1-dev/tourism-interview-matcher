"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/export";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children" | "value"> {
  /** 복사할 텍스트. 함수를 넘기면 클릭 시점에 계산합니다. */
  value: string | (() => string);
  label?: string;
  copiedLabel?: string;
}

export function CopyButton({
  value,
  label = "복사",
  copiedLabel = "복사됨",
  variant = "outline",
  size = "sm",
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!copied && !failed) return;
    const timer = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [copied, failed]);

  async function handleClick() {
    const text = typeof value === "function" ? value() : value;
    const succeeded = await copyToClipboard(text);
    if (succeeded) setCopied(true);
    else setFailed(true);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("no-print gap-1.5", className)}
      aria-live="polite"
      {...props}
    >
      {copied ? <Check className="text-emerald-600" /> : <Copy />}
      {failed ? "복사 실패" : copied ? copiedLabel : label}
    </Button>
  );
}
