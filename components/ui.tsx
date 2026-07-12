"use client";

import * as React from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "animate-rise-in rounded-3xl p-5 sm:p-6 glass",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "danger"
        ? "btn-danger"
        : "btn-ghost";
  return (
    <button
      className={cn("btn", variantClass, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/40 bg-white/40 p-1 dark:border-white/10 dark:bg-white/5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition",
          checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
    </button>
  );
}

export function Banner({
  kind,
  children,
}: {
  kind: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 text-sm",
        kind === "error"
          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
          : "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      )}
    >
      {children}
    </div>
  );
}
