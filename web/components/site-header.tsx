"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, firstName } from "@/lib/utils";
import {
  CardIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocIcon,
  LinkIcon,
} from "./icons";
import { BrandLockup } from "./ui";

export function SiteHeader({
  user,
  onConnect,
  onSignOut,
  onPayments,
  showDoctorLink = false,
}: {
  user: { name: string; email: string };
  onConnect: () => void;
  onSignOut: () => void;
  onPayments?: () => void;
  showDoctorLink?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "H";

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const menuItem =
    "flex w-full items-center gap-2.5 rounded-[13px] px-3 py-2.5 text-left text-[13px] text-foreground transition hover:bg-[#f4f8f8]";

  return (
    <header className="sticky top-0 z-40 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[108px] bg-gradient-to-b from-white via-white/90 to-transparent"
      />

      <nav className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-2 rounded-[22px] border border-[#e3e9ea] bg-white/90 px-2.5 py-2 shadow-[0_18px_45px_-26px_rgba(13,60,66,0.45)] backdrop-blur-xl sm:rounded-full sm:pl-4">
        <BrandLockup href="/dashboard" />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onConnect}
            title="Set up your assistant"
            className="group flex items-center gap-1.5 rounded-full border border-[#d3eef1] bg-[#f2fbfc] px-3 py-1.5 text-[11.5px] font-medium text-[#0b6570] transition hover:border-[#b8e7ec] hover:bg-[#eaf9fb]"
          >
            <span className="hidden sm:inline">Connect assistant</span>
            <span className="sm:hidden">Connect</span>
            <ChevronRightIcon className="size-3.5 text-[#4f929b] transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open account menu"
              className={cn(
                "flex items-center gap-2 rounded-full p-1 pr-1.5 transition hover:bg-[#f3f7f7] sm:pr-2",
                menuOpen && "bg-[#f3f7f7]",
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-[10.5px] font-semibold tracking-[0.03em] text-[#0d3c42] ring-2 ring-white">
                {initials}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[110px] truncate text-[12.5px] font-medium">
                  {firstName(user.name)}
                </span>
                <span className="block text-[9.5px] uppercase tracking-[0.12em] text-muted">
                  Your account
                </span>
              </span>
              <ChevronDownIcon
                className={cn(
                  "hidden size-3.5 text-muted transition-transform duration-200 sm:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="pop-in absolute right-0 top-[calc(100%+10px)] z-50 w-[252px] overflow-hidden rounded-[20px] border border-[#e3e9ea] bg-white p-1.5 shadow-[0_26px_60px_-18px_rgba(13,60,66,0.38)]"
              >
                <div className="rounded-[14px] bg-[#f6fafb] px-3 py-2.5">
                  <p className="font-serif text-[19px] leading-tight">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">
                    {user.email}
                  </p>
                </div>

                <div className="mt-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onConnect();
                    }}
                    className={menuItem}
                  >
                    <LinkIcon className="size-4 text-brand" />
                    Assistant setup
                  </button>

                  {onPayments ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onPayments();
                      }}
                      className={menuItem}
                    >
                      <CardIcon className="size-4 text-brand" />
                      Payment methods
                    </button>
                  ) : null}

                  {showDoctorLink ? (
                    <Link
                      href="/doctor"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={menuItem}
                    >
                      <DocIcon className="size-4 text-brand" />
                      Doctor console
                    </Link>
                  ) : null}
                </div>

                <div className="my-1.5 h-px bg-line" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className={cn(
                    menuItem,
                    "text-[#b15a5a] hover:bg-[#fdf3f3] hover:text-[#a44b4b]",
                  )}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
