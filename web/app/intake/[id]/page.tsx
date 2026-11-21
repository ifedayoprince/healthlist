"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import {
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  LockIcon,
} from "@/components/icons";
import {
  AuthShell,
  Button,
  Field,
  Input,
  Modal,
  ProductThumb,
  StatusBadge,
} from "@/components/ui";
import { Select } from "@/components/select";
import {
  displayStatus,
  intakeListings,
  missingQuestions,
} from "@/lib/intake";
import { useApp } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function IntakePage() {
  return (
    <RequireAuth>
      <IntakeDetail />
    </RequireAuth>
  );
}

function IntakeDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    sessionUser,
    intakes,
    removeIntakeProduct,
    submitIntake,
    cancelIntake,
  } = useApp();

  const id = decodeURIComponent(String(params.id ?? ""));
  const intake = intakes.find(
    (item) =>
      item.id.toLowerCase() === id.toLowerCase() &&
      item.userId === sessionUser?.id,
  );

  const [mode, setMode] = useState<"review" | "info">("review");
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => intake?.additionalAnswers ?? {},
  );
  const [error, setError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [preview, setPreview] = useState<Listing | null>(null);

  if (!intake) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <h1 className="font-serif text-[42px] leading-tight sm:text-5xl">
            Request not found
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            This intake request doesn&apos;t exist, or it belongs to a different
            account.
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

  if (intake.status === "cancelled") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-[#f0f2f3] text-[#7b8084]">
            <CloseIcon className="size-7" />
          </div>
          <h1 className="mt-6 font-serif text-[42px] leading-tight sm:text-5xl">
            Request cancelled
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            Nothing has been sent for review. You can ask your assistant to
            start a new intake request whenever you&apos;re ready.
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

  if (justSubmitted) {
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

  const listings = intakeListings(intake);
  const missing = missingQuestions(intake);
  const submitted = Boolean(intake.submittedAt);
  const editable = intake.status === "pending" && !submitted;
  const status = displayStatus(intake);
  const needsInfo = missing.length > 0;
  const missingListingNames = Array.from(
    new Set(missing.map((item) => item.listing.name)),
  );

  const requestReview = () => {
    setError("");
    if (needsInfo) {
      setMode("info");
      return;
    }
    submitIntake(intake.id);
    setJustSubmitted(true);
  };

  const saveInfoAndSubmit = () => {
    setError("");
    const unanswered = missing.filter(
      (item) => !answers[item.answerKey]?.trim(),
    );
    if (unanswered.length > 0) {
      setError("Answer all the questions before requesting a review.");
      return;
    }
    submitIntake(intake.id, answers);
    setJustSubmitted(true);
    setMode("review");
  };

  const cancel = () => {
    if (!cancelling) {
      setCancelling(true);
      return;
    }
    cancelIntake(intake.id);
    router.push("/dashboard");
  };

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col pb-10 pt-10 sm:pt-14">
        {mode === "review" ? (
          <>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <h1 className="font-serif text-[42px] leading-none tracking-[-0.02em] sm:text-[54px]">
                Intake Request
              </h1>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
            <p className="mt-3 text-[17px] text-muted">
              Your assistant added these products.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-[18px] bg-[#fff8eb] p-4 text-sm leading-relaxed text-[#8a6a2f]">
                <p className="font-medium">This request is with a doctor.</p>
                <p className="mt-1">
                  We&apos;ll update this page and your dashboard as soon as
                  it&apos;s reviewed.
                </p>
              </div>
            ) : null}

            {intake.status === "approved" ? (
              <div className="mt-6 rounded-[18px] bg-[#eef9f2] p-4 text-sm leading-relaxed text-[#2f7d52]">
                <p className="font-medium">Approved for purchase.</p>
                <p className="mt-1">
                  Your order is moving ahead. Your assistant can help you track
                  delivery.
                </p>
                {intake.doctorNote ? (
                  <p className="mt-3 text-[#3f6b53]">
                    <span className="font-medium">Doctor&apos;s note:</span>{" "}
                    {intake.doctorNote}
                  </p>
                ) : null}
              </div>
            ) : null}

            {intake.status === "declined" ? (
              <div className="mt-6 rounded-[18px] bg-[#fdf1f1] p-4 text-sm leading-relaxed text-[#a04e4e]">
                <p className="font-medium">Not approved this time.</p>
                {intake.doctorNote ? (
                  <p className="mt-1.5">
                    <span className="font-medium">Doctor&apos;s note:</span>{" "}
                    {intake.doctorNote}
                  </p>
                ) : (
                  <p className="mt-1">
                    A doctor reviewed this request but couldn&apos;t approve it.
                  </p>
                )}
              </div>
            ) : null}

            {listings.length === 0 ? (
              <div className="mt-10 rounded-[22px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] p-8 text-center">
                <p className="font-serif text-2xl">No products left</p>
                <p className="mt-2 text-sm text-muted">
                  You removed every product from this request. Ask your
                  assistant to start a new one.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Back to dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      cancelIntake(intake.id);
                      router.push("/dashboard");
                    }}
                  >
                    Cancel request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-9 space-y-8">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex gap-5 sm:gap-7">
                    <ProductThumb
                      listing={listing}
                      className="h-[172px] w-[120px] sm:h-[200px] sm:w-[150px]"
                    />
                    <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-serif text-[23px] leading-tight sm:text-[28px]">
                          {listing.name}
                        </h2>
                        {editable ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeIntakeProduct(intake.id, listing.id)
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
                ))}
              </div>
            )}

            {editable && needsInfo && listings.length > 0 ? (
              <div className="mt-9 flex gap-3 rounded-[16px] bg-[#f4fafb] p-4 text-sm leading-relaxed text-[#2c656d]">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Your assessment didn&apos;t cover everything a doctor needs for{" "}
                  {missingListingNames.join(", ")}. We&apos;ll ask a couple of
                  quick questions next.
                </p>
              </div>
            ) : null}

            <div className="mt-auto pt-12">
              {listings.length === 0 ? null : editable ? (
                <>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={requestReview}
                  >
                    {needsInfo
                      ? "Next: Provide additional info"
                      : "Request review"}
                  </Button>
                  <button
                    type="button"
                    onClick={cancel}
                    onBlur={() => setCancelling(false)}
                    className={cn(
                      "mt-7 block w-full text-center text-[17px] transition hover:text-brand",
                      cancelling && "font-medium text-[#c25d5d]",
                    )}
                  >
                    {cancelling
                      ? "Click again to cancel this request"
                      : "× Cancel"}
                  </button>
                </>
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
              A doctor needs a little more information about{" "}
              {missingListingNames.join(", ")} before reviewing this request.
              These answers stay on Healthlist.
            </p>

            <div className="mt-9 space-y-7">
              {missing.map(({ listing, question, answerKey }) => (
                <Field
                  key={answerKey}
                  label={
                    missing.length > 1
                      ? `${listing.name}: ${question.label}`
                      : question.label
                  }
                  htmlFor={answerKey}
                >
                  {question.type === "select" ? (
                    <Select
                      id={answerKey}
                      placeholder="Select from dropdown"
                      options={question.options ?? []}
                      value={answers[answerKey] ?? ""}
                      onValueChange={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          [answerKey]: value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      id={answerKey}
                      placeholder={question.placeholder}
                      value={answers[answerKey] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [answerKey]: event.target.value,
                        }))
                      }
                    />
                  )}
                </Field>
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
                onClick={saveInfoAndSubmit}
              >
                Save &amp; request review
              </Button>
              <button
                type="button"
                onClick={cancel}
                onBlur={() => setCancelling(false)}
                className={cn(
                  "mt-7 block w-full text-center text-[17px] transition hover:text-brand",
                  cancelling && "font-medium text-[#c25d5d]",
                )}
              >
                {cancelling
                  ? "Click again to cancel this request"
                  : "× Cancel"}
              </button>
            </div>
          </>
        )}
      </div>

      <ListingPreview listing={preview} onClose={() => setPreview(null)} />
    </AuthShell>
  );
}

function ListingPreview({
  listing,
  onClose,
}: {
  listing: Listing | null;
  onClose: () => void;
}) {
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
                {listing.category}
              </p>
              <h2
                id="listing-modal-title"
                className="mt-2 font-serif text-[34px] leading-tight sm:text-[38px]"
              >
                {listing.name}
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
            <ProductThumb
              listing={listing}
              className="h-[230px] w-full rounded-[16px]"
            />
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-serif text-[32px] leading-none">
                  ${listing.price}
                </p>
                <p className="text-sm text-muted">
                  ★ {listing.rating.toFixed(1)} · {listing.reviews} reviews
                </p>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {listing.description}
              </p>
              <ul className="mt-4 space-y-2">
                {listing.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {listing.additionalQuestions?.length ? (
            <div className="mt-6 rounded-[16px] bg-[#f4fafb] p-4 text-sm leading-relaxed text-[#2c656d]">
              <p className="font-medium">
                {listing.additionalQuestions.length} extra question
                {listing.additionalQuestions.length === 1 ? "" : "s"} at review
              </p>
              <p className="mt-1">
                A doctor may ask for a little more information about this
                product before approving it.
              </p>
            </div>
          ) : null}

          <Button size="lg" className="mt-6 w-full" onClick={onClose}>
            Back to request
            <ChevronRightIcon className="size-4" />
          </Button>
        </>
      ) : null}
    </Modal>
  );
}
