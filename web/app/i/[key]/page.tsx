"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  LockIcon,
} from "@/components/icons";
import {
  isQuestionAnswered,
  QuestionField,
  sanitizeAnswer,
} from "@/components/question-field";
import { RequireAuth } from "@/components/require-auth";
import {
  AuthShell,
  Button,
  Modal,
  StatusBadge,
} from "@/components/ui";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getIntake, submitIntake } from "@/lib/api/intake";
import type { ApiListing, IntakeSession } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type LoadStatus = "loading" | "ready" | "error" | "not_found";

export default function IntakePage() {
  return (
    <RequireAuth>
      <IntakeSessionPage />
    </RequireAuth>
  );
}

function IntakeSessionPage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const key = decodeURIComponent(String(params.key ?? ""));

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"review" | "info">("review");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ApiListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getIntake(key);
      setSession(data);
      setAnswers({});
      setRemoved(new Set());
      setMode("review");
      setError("");
      setStatus("ready");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setStatus("not_found");
        return;
      }
      setError(errorMessage(cause));
      setStatus("error");
    }
  }, [key]);

  useEffect(() => {
    // Loading from the API is an external-system sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const submit = async (answerValues: Record<string, string[]>) => {
    if (!session) return;

    const remainingQuestionKeys = new Set(
      session.listings
        .filter((listing) => !removed.has(listing.id))
        .flatMap((listing) => listing.additionalQuestions),
    );
    const required = session.questions.filter(
      (question) =>
        question.isRequired &&
        question.assessmentAnswers.length === 0 &&
        remainingQuestionKeys.has(question.key),
    );
    const unanswered = required.filter(
      (question) => !isQuestionAnswered(question, answerValues[question.key] ?? []),
    );

    if (unanswered.length > 0) {
      setError(
        "Answer all the required questions before requesting a review.",
      );
      return;
    }

    const payload = required
      .map((question) => ({
        question,
        value: answerValues[question.key] ?? [],
      }))
      .filter(({ question, value }) => isQuestionAnswered(question, value))
      .map(({ question, value }) => ({
        questionKey: question.key,
        answer: sanitizeAnswer(question, value),
      }));

    setSubmitting(true);
    setError("");

    try {
      await submitIntake({
        intakeKey: session.key,
        answers: payload,
        removedListings: [...removed],
      });
      window.dispatchEvent(new Event("healthlist:intakes-updated"));
      setSuccess(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
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

  if (status === "not_found") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <h1 className="font-serif text-[42px] leading-tight sm:text-5xl">
            Request not found
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            This intake link is invalid, or it belongs to a different account.
          </p>
          <Button
            size="lg"
            className="mt-10 w-full max-w-[526px]"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (status === "error" || !session) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <h1 className="font-serif text-[42px] leading-tight sm:text-5xl">
            We couldn&apos;t open this request
          </h1>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-muted">
            {error || "Please try again."}
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

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-mint-soft text-brand">
            <CheckIcon className="size-7" />
          </div>
          <h1 className="mt-6 font-serif text-[42px] leading-tight sm:text-5xl">
            Request sent
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            A doctor will review your intake request. We&apos;ll let you know as
            soon as there&apos;s a decision.
          </p>
          <Button
            size="lg"
            className="mt-10 w-full max-w-[526px]"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </div>
      </AuthShell>
    );
  }

  const remainingListings = session.listings.filter(
    (listing) => !removed.has(listing.id),
  );
  const editable = session.status === "PENDING";
  const canRemove = editable && remainingListings.length > 1;
  const remainingQuestionKeys = new Set(
    remainingListings.flatMap((listing) => listing.additionalQuestions),
  );
  const missingRequired = session.questions.filter(
    (question) =>
      question.isRequired &&
      question.assessmentAnswers.length === 0 &&
      remainingQuestionKeys.has(question.key),
  );
  const statusMeta = sessionStatusMeta(session.status);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col pb-10 pt-10 sm:pt-14">
        {mode === "review" ? (
          <>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <h1 className="font-serif text-[42px] leading-none tracking-[-0.02em] sm:text-[54px]">
                Intake Request
              </h1>
              <StatusBadge tone={statusMeta.tone}>
                {statusMeta.label}
              </StatusBadge>
            </div>
            <p className="mt-3 text-[17px] text-muted">
              Your assistant added these products.
            </p>

            {session.status === "IN_REVIEW" ? (
              <div className="mt-6 rounded-[18px] bg-[#fff8eb] p-4 text-sm leading-relaxed text-[#8a6a2f]">
                <p className="font-medium">This request is with a doctor.</p>
                <p className="mt-1">
                  We&apos;ll update this page and your dashboard as soon as
                  it&apos;s reviewed.
                </p>
              </div>
            ) : null}

            {session.status === "APPROVED" ? (
              <div className="mt-6 rounded-[18px] bg-[#eef9f2] p-4 text-sm leading-relaxed text-[#2f7d52]">
                <p className="font-medium">Approved for purchase.</p>
                <p className="mt-1">
                  Your order is moving ahead. A licensed pharmacy will mail your prescription within the next 3 - 4 days.
                </p>
                {session.doctorRemark ? (
                  <p className="mt-3 text-[#3f6b53]">
                    <span className="font-medium">Doctor&apos;s note:</span>{" "}
                    {session.doctorRemark}
                  </p>
                ) : null}
              </div>
            ) : null}

            {session.status === "REJECTED" ? (
              <div className="mt-6 rounded-[18px] bg-[#fdf1f1] p-4 text-sm leading-relaxed text-[#a04e4e]">
                <p className="font-medium">Not approved this time.</p>
                {session.doctorRemark ? (
                  <p className="mt-1.5">
                    <span className="font-medium">Doctor&apos;s note:</span>{" "}
                    {session.doctorRemark}
                  </p>
                ) : (
                  <p className="mt-1">
                    A doctor reviewed this request but couldn&apos;t approve it.
                  </p>
                )}
              </div>
            ) : null}

            {remainingListings.length === 0 ? (
              <div className="mt-10 rounded-[22px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] p-8 text-center">
                <p className="font-serif text-2xl">No products left</p>
                <p className="mt-2 text-sm text-muted">
                  Your request needs at least one product.
                </p>
              </div>
            ) : (
              <div className="mt-9 space-y-8">
                {remainingListings.map((listing) => {
                  const document = listing.documents[0];
                  const name = document?.name || listing.slug || listing.brand;

                  return (
                    <div key={listing.id} className="flex gap-5 sm:gap-7">
                      <ListingThumb
                        listing={listing}
                        className="h-[172px] w-[120px] sm:h-[200px] sm:w-[150px]"
                      />
                      <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-serif text-[23px] leading-tight sm:text-[28px]">
                            {name}
                          </h2>
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() =>
                                setRemoved((current) => {
                                  const next = new Set(current);
                                  next.add(listing.id);
                                  return next;
                                })
                              }
                              className="shrink-0 pt-1 text-sm font-medium text-danger transition hover:underline"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[15px]">
                          Brand: {listing.brand}
                        </p>
                        <p className="mt-1 text-[15px] text-[#8b8f92]">
                          {listing.reviews} reviews
                        </p>
                        <Button
                          size="sm"
                          className="mt-4 h-11 w-full max-w-[200px] rounded-[12px]"
                          onClick={() => setPreview(listing)}
                        >
                          View listing
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {editable && missingRequired.length > 0 ? (
              <div className="mt-9 flex gap-3 rounded-[16px] bg-[#f4fafb] p-4 text-sm leading-relaxed text-[#2c656d]">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Your assessment didn&apos;t cover everything a doctor needs for
                  this request. We&apos;ll ask a few quick questions next.
                </p>
              </div>
            ) : null}

            <div className="mt-auto pt-12">
              {editable ? (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={submitting || remainingListings.length === 0}
                  onClick={() => {
                    setError("");
                    if (missingRequired.length > 0) {
                      setMode("info");
                      return;
                    }
                    void submit({});
                  }}
                >
                  {submitting
                    ? "Sending…"
                    : missingRequired.length > 0
                      ? "Next: Provide additional info"
                      : "Request review"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="soft"
                  className="w-full"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to dashboard
                </Button>
              )}

              {error ? (
                <p
                  className="mt-5 text-center text-sm text-[#c25d5d]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {editable && removed.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setRemoved(new Set())}
                  className="mt-5 block w-full text-center text-sm text-muted transition hover:text-brand"
                >
                  Undo removed products
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("review");
                setError("");
              }}
              className="w-fit text-sm text-muted transition hover:text-foreground"
            >
              ← Back to products
            </button>

            <h1 className="mt-6 font-serif text-[40px] leading-none tracking-[-0.02em] sm:text-[52px]">
              Additional info
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              A doctor needs a little more information before reviewing this
              request. These answers stay on Healthlist.
            </p>

            <div className="mt-9 space-y-8">
              {missingRequired.map((question) => (
                <QuestionField
                  key={question.key}
                  question={question}
                  value={answers[question.key] ?? []}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.key]: value,
                    }))
                  }
                  disabled={submitting}
                />
              ))}
            </div>

            {error ? (
              <p className="mt-6 text-sm text-[#c25d5d]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-auto pt-10">
              <Button
                size="lg"
                className="w-full"
                disabled={submitting}
                onClick={() => void submit(answers)}
              >
                {submitting ? "Sending…" : "Save & request review"}
              </Button>
            </div>
          </>
        )}
      </div>

      <ListingPreview
        listing={preview}
        onClose={() => setPreview(null)}
      />
    </AuthShell>
  );
}

function ListingThumb({
  listing,
  className,
}: {
  listing: ApiListing;
  className?: string;
}) {
  if (listing.productImage) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-[14px] bg-mint bg-cover bg-center",
          className,
        )}
        style={{ backgroundImage: `url(${listing.productImage})` }}
        role="img"
        aria-label={listing.documents[0]?.name || listing.brand}
      />
    );
  }

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

function ListingPreview({
  listing,
  onClose,
}: {
  listing: ApiListing | null;
  onClose: () => void;
}) {
  const document = listing?.documents[0];
  const name = document?.name || listing?.slug || listing?.brand;
  const categories = document?.metadata?.category ?? [];

  return (
    <Modal
      open={Boolean(listing)}
      onClose={onClose}
      labelledBy="listing-modal-title"
      className="sm:max-w-[680px]"
    >
      {listing ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Healthlist listing
              </p>
              <h2
                id="listing-modal-title"
                className="mt-2 font-serif text-[34px] leading-tight sm:text-[38px]"
              >
                {name}
              </h2>
              <p className="mt-1.5 text-[15px] text-muted">
                by {listing.brand}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-[#f2f4f5] hover:text-foreground"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
            <ListingThumb
              listing={listing}
              className="h-[230px] w-full rounded-[16px]"
            />
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {document?.metadata?.price != null ? (
                  <p className="font-serif text-[32px] leading-none">
                    ${document.metadata.price}
                  </p>
                ) : (
                  <p className="font-serif text-[32px] leading-none">
                    {listing.brand}
                  </p>
                )}
                <p className="text-sm text-muted">{listing.reviews} reviews</p>
              </div>

              {categories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-[#f2f6f6] px-2.5 py-1 text-[11px] text-[#4e6a6e]"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                {document?.excerpt ||
                  document?.body ||
                  "No listing details are available yet."}
              </p>
            </div>
          </div>

          <Button size="lg" className="mt-6 w-full" onClick={onClose}>
            Back to request
            <ChevronRightIcon className="size-4" />
          </Button>
        </>
      ) : null}
    </Modal>
  );
}

function sessionStatusMeta(status: IntakeSession["status"]) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", tone: "success" as const };
    case "REJECTED":
      return { label: "Not approved", tone: "danger" as const };
    case "IN_REVIEW":
      return { label: "In review", tone: "pending" as const };
    case "PENDING":
    default:
      return { label: "Pending", tone: "pending" as const };
  }
}
