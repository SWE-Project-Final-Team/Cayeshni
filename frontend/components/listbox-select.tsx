"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ListboxOption = {
  value: string;
  label: string;
  description?: string;
};

type ListboxSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Material icon name (without fill) */
  leadingIcon?: string;
  className?: string;
  /** Panel alignment under trigger */
  align?: "start" | "end";
  /** Max height of options list */
  maxHeightClass?: string;
};

export function ListboxSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyMessage = "No options",
  disabled = false,
  leadingIcon,
  className = "",
  align = "start",
  maxHeightClass = "max-h-56",
}: ListboxSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const btnId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={btnId}
        type="button"
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && options.length > 0 && setOpen((o) => !o)}
        className={[
          "w-full flex items-center gap-sm rounded-lg border px-md py-sm text-left transition-colors",
          "bg-surface border-outline-variant font-body-md text-body-md text-on-surface",
          "focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open ? "border-secondary ring-2 ring-secondary/20" : "hover:border-outline",
        ].join(" ")}
      >
        {leadingIcon ? (
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
            {leadingIcon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 flex flex-col gap-0">
          <span className="truncate font-body-md text-on-surface">
            {selected?.label ?? (options.length === 0 ? emptyMessage : placeholder)}
          </span>
          {selected?.description ? (
            <span className="truncate text-xs text-on-surface-variant font-normal leading-tight">
              {selected.description}
            </span>
          ) : null}
        </span>
        <span
          className={`material-symbols-outlined text-[20px] text-on-surface-variant shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {open && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={btnId}
          className={[
            "absolute z-50 mt-xs w-full rounded-lg border border-outline-variant",
            "bg-surface-container-lowest shadow-level-2 overflow-hidden py-xs",
            maxHeightClass,
            "overflow-y-auto overscroll-contain",
            align === "end" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    "w-full text-left px-md py-sm flex flex-col gap-0 transition-colors",
                    "font-body-md text-on-surface hover:bg-secondary-fixed/40",
                    isSelected ? "bg-secondary-fixed text-on-secondary-fixed font-semibold" : "",
                  ].join(" ")}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.description ? (
                    <span
                      className={`truncate text-xs leading-tight ${
                        isSelected ? "text-on-secondary-fixed/80" : "text-on-surface-variant"
                      }`}
                    >
                      {opt.description}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
