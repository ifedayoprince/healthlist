"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import { CheckIcon, EyeIcon, EyeOffIcon } from "./icons";

type ButtonVariant = "primary" | "soft" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  soft: "bg-mint text-[#0d3c42] hover:bg-[#a2e4ed]",
  outline:
    "border border-line bg-white text-foreground hover:border-[#d3d7d9] hover:bg-[#f8fafb]",
  ghost: "text-muted hover:bg-[#f2f4f5] hover:text-foreground",
  danger: "text-danger hover:bg-[#fdf1f1]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-10 rounded-[13px] px-4 text-sm",
  md: "h-12 rounded-[16px] px-6 text-[15px]",
  lg: "h-[76px] rounded-[22px] px-8 text-lg sm:h-[80px] sm:text-xl",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

export const inputClasses =
  "h-[66px] w-full rounded-[18px] bg-input px-6 text-[17px] text-foreground outline-none transition placeholder:text-[#97999b] focus:ring-2 focus:ring-brand/25 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-14", className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#777c7f] transition hover:bg-white/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOffIcon className="size-5" />
        ) : (
          <EyeIcon className="size-5" />
        )}
      </button>
    </div>
  );
}

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-[132px] w-full resize-y rounded-[18px] bg-input px-6 py-5 text-[17px] text-foreground outline-none transition placeholder:text-[#97999b] focus:ring-2 focus:ring-brand/25",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-3 block text-[17px] leading-snug text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-sm text-[#c25d5d]">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function CheckField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex w-fit cursor-pointer select-none items-center gap-3 py-1 text-[17px] text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[22px] place-items-center rounded-[5px] border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-2",
          checked
            ? "border-brand bg-brand text-white"
            : "border-[#c5c8ca] bg-white",
        )}
      >
        <CheckIcon
          className={cn(
            "size-3.5 transition-opacity",
            checked ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}

type Tone = "pending" | "success" | "danger" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  pending: "bg-[#ffeed4] text-[#9d7c3b]",
  success: "bg-[#dcf3e6] text-[#2f7d52]",
  danger: "bg-[#fde4e4] text-[#b85252]",
  neutral: "bg-[#eef0f1] text-[#6d7377]",
  info: "bg-[#e3f6f9] text-[#0b7c8b]",
};

export function StatusBadge({
  tone = "pending",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[10px] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-[#102225]/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-[0_24px_80px_-20px_rgba(16,34,37,0.35)] sm:max-w-[560px] sm:rounded-[28px] sm:p-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
    </div>
  );
}

export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-serif text-[2rem] leading-none tracking-[-0.03em] text-foreground",
        className,
      )}
    >
      healthlist
    </Link>
  );
}

export function BrandLockup({
  href = "/dashboard",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Healthlist home"
      className={cn(
        "min-w-0 rounded-full py-1 pr-2 font-serif text-[1.55rem] leading-none tracking-[-0.03em] text-foreground transition-colors hover:text-brand sm:text-[1.65rem]",
        className,
      )}
    >
      healthlist
    </Link>
  );
}

export function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="pb-2 pt-9 text-center">
        <Brand />
      </div>
      <div className="mx-auto flex w-full max-w-[574px] flex-1 flex-col px-6">
        {children}
      </div>
      {footer ? (
        <div className="px-6 pb-8 text-center text-xs text-muted">{footer}</div>
      ) : null}
    </div>
  );
}

export function ProductThumb({
  className,
}: {
  listing?: Listing;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[14px] bg-mint",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.55),transparent_62%)]" />
    </div>
  );
}
