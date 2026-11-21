"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { inputClasses } from "./ui";

export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = options.indexOf(value);
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const scrollOptionIntoView = (index: number) => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      const option = list?.querySelector<HTMLElement>(
        `[data-index="${index}"]`,
      );
      if (!list || !option) return;

      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < list.scrollTop) {
        list.scrollTop = top;
      } else if (bottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = bottom - list.clientHeight;
      }
    });
  };

  const openList = (index?: number) => {
    if (disabled) return;
    const next = index ?? (selectedIndex >= 0 ? selectedIndex : 0);
    setActiveIndex(next);
    setOpen(true);
    scrollOptionIntoView(next);
  };

  const selectOption = (option: string) => {
    onValueChange(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (delta: number) => {
    if (options.length === 0) return;
    const next = (activeIndex + delta + options.length) % options.length;
    setActiveIndex(next);
    scrollOptionIntoView(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openList(event.key === "ArrowUp" ? options.length - 1 : undefined);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        scrollOptionIntoView(0);
        break;
      case "End": {
        event.preventDefault();
        const last = Math.max(options.length - 1, 0);
        setActiveIndex(last);
        scrollOptionIntoView(last);
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeOption) selectOption(activeOption);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeOption
            ? `${triggerId}-option-${activeIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={cn(
          inputClasses,
          "flex items-center justify-between gap-3 text-left",
          !value && "text-[#8f9295]",
          className,
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDownIcon
          className={cn(
            "size-5 shrink-0 text-[#6f7376] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="pop-in absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-[18px] border border-[#e2e7e8] bg-white p-1.5 shadow-[0_20px_55px_-18px_rgba(13,60,66,0.35)]">
          <div
            ref={listRef}
            role="listbox"
            id={listboxId}
            aria-labelledby={triggerId}
            className="max-h-[286px] overflow-y-auto overscroll-contain"
          >
            {options.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted">No options</p>
            ) : null}

            {options.map((option, index) => {
              const isSelected = option === value;
              return (
                <div
                  key={option}
                  id={`${triggerId}-option-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3.5 py-3 text-[16px] transition-colors",
                    index === activeIndex
                      ? "bg-[#eefafb] text-[#0f4b52]"
                      : "text-foreground",
                    isSelected && "font-medium",
                  )}
                >
                  <span>{option}</span>
                  {isSelected ? (
                    <CheckIcon className="size-4 shrink-0 text-brand" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
