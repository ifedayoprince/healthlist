"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { AssessmentQuestion } from "@/lib/api/types";
import { CheckIcon } from "./icons";
import { inputClasses } from "./ui";

export function QuestionField({
  question,
  value,
  onChange,
  disabled = false,
}: {
  question: AssessmentQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const labelId = useId();
  const options = question.options ?? [];

  return (
    <fieldset disabled={disabled}>
      <legend
        id={labelId}
        className="text-[17px] leading-relaxed text-foreground"
      >
        {question.question}
        {!question.isRequired ? (
          <span className="ml-2 inline-flex translate-y-[-1px] rounded-full bg-[#f0f3f3] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Optional
          </span>
        ) : null}
      </legend>

      {question.type === "MULTI_SELECT" ? (
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
        />
      ) : null}

      {question.type === "YES_NO" ? (
        <YesNoChoice
          value={value[0] === "true" ? "yes" : value[0] === "false" ? "no" : null}
          onChange={(choice) => onChange([choice === "yes" ? "true" : "false"])}
        />
      ) : null}

      {question.type === "YES_NO_TEXT" ? (
        <YesNoTextChoice
          labelId={labelId}
          value={value}
          onChange={onChange}
        />
      ) : null}

      {question.type === "TEXT_LIST" ? (
        <textarea
          aria-labelledby={labelId}
          className="mt-5 min-h-[132px] w-full resize-y rounded-[18px] bg-input px-6 py-5 text-[17px] text-foreground outline-none transition placeholder:text-[#97999b] focus:ring-2 focus:ring-brand/25 disabled:opacity-60"
          placeholder="Type your answer. Add one item per line if there are multiple."
          value={value.join("\n")}
          onChange={(event) => onChange(event.target.value.split("\n"))}
        />
      ) : null}
    </fieldset>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: AssessmentQuestion["options"];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  if (!options || options.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        No options are available for this question yet.
      </p>
    );
  }

  const selected = new Set(value);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  return (
    <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
      {options.map((option) => {
        const checked = selected.has(option.key);
        return (
          <button
            key={option.key}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => toggle(option.key)}
            className={cn(
              "flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[15px] transition",
              checked
                ? "border-brand/45 bg-[#eefafb] text-[#0f4b52]"
                : "border-[#e0e4e5] bg-white text-foreground hover:border-brand/35 hover:bg-[#fbfdfd]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[20px] shrink-0 place-items-center rounded-[5px] border-2 transition-colors",
                checked
                  ? "border-brand bg-brand text-white"
                  : "border-[#c5c8ca] bg-white",
              )}
            >
              <CheckIcon
                className={cn(
                  "size-3 transition-opacity",
                  checked ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            <span>{option.value}</span>
          </button>
        );
      })}
    </div>
  );
}

function YesNoChoice({
  value,
  onChange,
}: {
  value: "yes" | "no" | null;
  onChange: (value: "yes" | "no") => void;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2.5">
      <ChoiceButton
        active={value === "yes"}
        label="Yes"
        onClick={() => onChange("yes")}
      />
      <ChoiceButton
        active={value === "no"}
        label="No"
        onClick={() => onChange("no")}
      />
    </div>
  );
}

function YesNoTextChoice({
  labelId,
  value,
  onChange,
}: {
  labelId: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [choice, setChoice] = useState<"yes" | "no" | null>(() => {
    if (value.length === 0) return null;
    return value[0] ? "yes" : "no";
  });

  const text = value[0] ?? "";

  const choose = (next: "yes" | "no") => {
    setChoice(next);
    if (next === "no") {
      onChange([""]);
      return;
    }
    onChange(text.trim() ? [text] : []);
  };

  const updateText = (next: string) => {
    onChange(next.trim() ? [next] : []);
  };

  return (
    <div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <ChoiceButton
          active={choice === "yes"}
          label="Yes"
          onClick={() => choose("yes")}
        />
        <ChoiceButton
          active={choice === "no"}
          label="No"
          onClick={() => choose("no")}
        />
      </div>

      {choice === "yes" ? (
        <div className="step-in mt-4">
          <label
            htmlFor={`${labelId}-detail`}
            className="mb-2 block text-sm text-muted"
          >
            Tell us a little more
          </label>
          <input
            id={`${labelId}-detail`}
            className={inputClasses}
            placeholder="Type your response"
            value={text}
            onChange={(event) => updateText(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[56px] items-center justify-center gap-2 rounded-[14px] border text-[15px] font-medium transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-[#e0e4e5] bg-white text-foreground hover:border-brand/35 hover:bg-[#fbfdfd]",
      )}
    >
      {active ? <CheckIcon className="size-4" /> : null}
      {label}
    </button>
  );
}

export function isQuestionAnswered(
  question: AssessmentQuestion,
  value: string[],
) {
  switch (question.type) {
    case "MULTI_SELECT":
      return value.length > 0;
    case "YES_NO":
      return value[0] === "true" || value[0] === "false";
    case "YES_NO_TEXT":
      return value.length > 0;
    case "TEXT_LIST":
      return value.some((item) => item.trim().length > 0);
    default:
      return value.length > 0;
  }
}

export function sanitizeAnswer(
  question: AssessmentQuestion,
  value: string[],
) {
  switch (question.type) {
    case "YES_NO":
      return [value[0] === "true" ? "true" : "false"];
    case "YES_NO_TEXT":
      return [(value[0] ?? "").trim()];
    case "TEXT_LIST":
      return value.map((item) => item.trim()).filter(Boolean);
    default:
      return value;
  }
}
