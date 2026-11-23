"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckIcon, LockIcon } from "@/components/icons";
import {
  isQuestionAnswered,
  QuestionField,
  sanitizeAnswer,
} from "@/components/question-field";
import { RequireAuth } from "@/components/require-auth";
import { AuthShell, Button } from "@/components/ui";
import {
  getAssessment,
  submitAnswer,
  updateAnswer,
} from "@/lib/api/assessment";
import { errorMessage } from "@/lib/api/client";
import type { AssessmentQuestion } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { consumeRedirect } from "@/lib/redirect";

export default function AssessmentPage() {
  return (
    <RequireAuth>
      <AssessmentFlow />
    </RequireAuth>
  );
}

function AssessmentFlow() {
  const router = useRouter();
  const { completeAssessment } = useAuth();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAssessment();
      setQuestions(data.preliminary.pending);
      setCompletedCount(data.preliminary.completed.length);
      setIndex(0);
      setAnswers({});
      setSubmitted({});
      setError("");
      setStatus("ready");
    } catch (cause) {
      setError(errorMessage(cause));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Loading from the API is an external-system sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const goToNextDestination = () => {
    completeAssessment();
    const next = consumeRedirect();
    router.replace(next && next !== "/assessment" ? next : "/dashboard");
  };

  const current = questions[index];

  const goNext = async () => {
    if (!current) return;

    const value = answers[current.key] ?? [];
    if (current.isRequired && !isQuestionAnswered(current, value)) {
      setError(
        current.type === "YES_NO_TEXT"
          ? "Add a response before continuing, or choose No."
          : "Answer this question to continue.",
      );
      return;
    }

    const payload = sanitizeAnswer(current, value);
    setBusy(true);
    setError("");

    try {
      if (submitted[current.key]) {
        await updateAnswer(current.key, payload);
      } else {
        await submitAnswer(current.key, payload);
      }

      setSubmitted((previous) => ({ ...previous, [current.key]: true }));
      setAnswers((previous) => ({ ...previous, [current.key]: payload }));

      if (index < questions.length - 1) {
        setIndex((previous) => previous + 1);
      } else {
        goToNextDestination();
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthShell>
        <div className="flex flex-1 items-center justify-center pb-16">
          <div className="size-7 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <h1 className="font-serif text-[42px] leading-tight sm:text-5xl">
            We couldn&apos;t load your assessment
          </h1>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-muted">
            {error}
          </p>
          <Button
            size="lg"
            className="mt-9 w-full max-w-[420px]"
            onClick={() => {
              setStatus("loading");
              void load();
            }}
          >
            Try again
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (!current) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-mint-soft text-brand">
            <CheckIcon className="size-7" />
          </div>
          <h1 className="mt-6 font-serif text-[42px] leading-tight sm:text-5xl">
            Assessment complete
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            Your answers are on file. Our doctors use them to review every
            intake request you submit.
          </p>
          <Button
            size="lg"
            className="mt-10 w-full max-w-[526px]"
            onClick={goToNextDestination}
          >
            Continue
          </Button>
        </div>
      </AuthShell>
    );
  }

  const total = completedCount + questions.length;
  const position = completedCount + index + 1;
  const isLast = index === questions.length - 1;

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col pb-10 pt-10 sm:pt-14">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[42px] leading-none tracking-[-0.02em] sm:text-[54px]">
            Assessment
          </h1>
          <span className="pt-2 text-sm text-muted">
            {position} of {total}
          </span>
        </div>

        <div key={current.key} className="step-in mt-10 flex-1 sm:mt-12">
          <QuestionField
            question={current}
            value={answers[current.key] ?? []}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, [current.key]: value }))
            }
            disabled={busy}
          />

          <div className="mt-8 flex gap-3 rounded-[16px] bg-[#f4fafb] p-4 text-[13px] leading-relaxed text-[#2c656d]">
            <LockIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              These answers are shared only with the doctor reviewing your
              intake requests. Your assistant never sees them.
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-[#c25d5d]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-16 flex items-center justify-between gap-4 pb-2 sm:mt-24">
          <Button
            size="lg"
            variant="soft"
            className="w-[44%] px-4 !text-[19px] sm:w-[174px]"
            disabled={index === 0 || busy}
            onClick={() => {
              setError("");
              setIndex((value) => Math.max(0, value - 1));
            }}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="w-[44%] px-4 !text-[19px] sm:w-[174px]"
            disabled={busy}
            onClick={() => void goNext()}
          >
            {busy ? "Saving…" : isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
