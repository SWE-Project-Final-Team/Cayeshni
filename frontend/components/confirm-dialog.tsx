"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, confirm uses error styling (destructive). */
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger,
  pending,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useI18n();
  const resolvedConfirmLabel = confirmLabel ?? t("Confirm");
  const resolvedCancelLabel = cancelLabel ?? t("Cancel");
  const resolvedPendingLabel = t("Please wait…");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-inverse-surface/55 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        className="w-full max-w-[min(calc(100vw-2rem),42rem)] rounded-2xl border border-outline-variant/80 bg-surface shadow-level-2 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-t-4 border-secondary bg-gradient-to-br from-surface-container-high/60 to-surface px-lg pt-lg pb-md">
          <h2
            id="confirm-dialog-title"
            className="font-headline-md text-headline-md text-on-surface"
          >
            {title}
          </h2>
          {description ? (
            <div
              id="confirm-dialog-desc"
              className="mt-sm font-body-md text-on-surface-variant text-pretty"
            >
              {description}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-sm px-lg py-md bg-surface-container-low/50 border-t border-outline-variant/40">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="sm:min-w-[7rem] rounded-lg border border-outline-variant bg-surface px-md py-sm font-label-sm text-primary hover:bg-surface-container-high disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`sm:min-w-[7rem] rounded-lg px-md py-sm font-label-sm text-on-primary disabled:opacity-50 ${
              danger
                ? "bg-error text-on-error hover:opacity-95"
                : "bg-secondary hover:bg-secondary/90"
            }`}
          >
            {pending ? resolvedPendingLabel : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
