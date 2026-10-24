"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

/**
 * Vercel-style destructive confirmation: the user must type the resource name
 * (and the verb phrase) before the action is enabled.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  phrase,
  action = "Continue",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmText: string;
  phrase?: string;
  action?: string;
  danger?: boolean;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const ok = a === confirmText && (!phrase || b === phrase);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] animate-fade-up overflow-hidden rounded-t-xl border border-line-strong bg-bg-100 shadow-2xl sm:rounded-xl"
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {children && <div className="mt-3 text-sm text-muted">{children}</div>}
          {danger && (
            <div className="mt-4 flex gap-2 rounded-md bg-err/10 p-3 text-sm text-err">
              <Icon name="alert" className="mt-0.5 shrink-0" />
              This action is audited and cannot be undone.
            </div>
          )}
          <label className="mt-5 block text-[13px] text-muted">
            Enter <span className="font-mono font-medium text-fg">{confirmText}</span> to continue:
            <Input value={a} onChange={(e) => setA(e.target.value)} className="mt-2 font-mono" autoFocus />
          </label>
          {phrase && (
            <label className="mt-4 block text-[13px] text-muted">
              To verify, type <span className="font-medium text-fg">{phrase}</span> below:
              <Input value={b} onChange={(e) => setB(e.target.value)} className="mt-2" />
            </label>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t border-line bg-bg-200 px-6 py-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="md"
            disabled={!ok}
            onClick={() => {
              onConfirm();
              setA("");
              setB("");
            }}
          >
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}
