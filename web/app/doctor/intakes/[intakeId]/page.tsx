"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { DocIcon } from "@/components/icons";
import { ListingPreview, ListingThumb } from "@/components/listing-preview";
import { RequireAuth } from "@/components/require-auth";
import {
  BrandLockup,
  Button,
  Modal,
  PageLoader,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { ApiError, errorMessage } from "@/lib/api/client";
import { intakeStatusMeta } from "@/lib/api/intake";
import {
  doctorListingName,
  doctorPatientLabel,
  doctorPatientMeta,
  formatDoctorAnswer,
  getDoctorAssessment,
  getDoctorIntake,
  submitDoctorReview,
} from "@/lib/api/doctor";
import type { ApiListing, DoctorAssessment, DoctorIntake } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";

type LoadStatus = "loading" | "ready" | "not_found" | "error" | "forbidden";
type Decision = "approve" | "decline";

export default function DoctorIntakePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoader />}>
        <DoctorIntakeReview />
      </Suspense>
    </RequireAuth>
  );
}

function DoctorIntakeReview() {
  const params = useParams<{ intakeId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const intakeId = decodeURIComponent(String(params.intakeId ?? ""));

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [intake, setIntake] = useState<DoctorIntake | null>(null);
  const [error, setError] = useState("");

  const [assessment, setAssessment] = useState<DoctorAssessment>(null);
  const [assessmentState, setAssessmentState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [assessmentError, setAssessmentError] = useState("");
  const [preview, setPreview] = useState<ApiListing | null>(null);

  const [decision, setDecision] = useState<Decision | null>(null);
  const [remark, setRemark] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const load = useCallback(async () => {
    try {
      const found = await getDoctorIntake(intakeId);

      setIntake(found);
      setStatus("ready");

      if (!found.userId) {
        setAssessmentState("error");
        setAssessmentError("This intake has no patient attached.");
        return;
      }

      try {
        const data = await getDoctorAssessment(found.userId);
        setAssessment(data);
        setAssessmentState("ready");
      } catch (cause) {
        setAssessmentError(errorMessage(cause));
        setAssessmentState("error");
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setStatus("not_found");
        return;
      }
      if (
        cause instanceof ApiError &&
        (cause.status === 401 || cause.status === 403)
      ) {
        setStatus("forbidden");
        return;
      }
      setError(errorMessage(cause));
      setStatus("error");
    }
  }, [intakeId]);

  const isDenied = user?.role !== "DOCTOR";

  useEffect(() => {
    if (isDenied) return;
    // Loading from the API is an external-system sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [isDenied, load]);

  const openDecision = (next: Decision) => {
    setDecision(next);
    setRemark("");
    setReviewError("");
  };

  const confirmDecision = async () => {
    if (!decision || !intake) return;

    setReviewing(true);
    setReviewError("");

    try {
      await submitDoctorReview(intake.id, {
        isApproved: decision === "approve",
        remark: remark.trim() || undefined,
      });
      router.replace("/doctor");
    } catch (cause) {
      setReviewError(errorMessage(cause));
      setReviewing(false);
    }
  };

  if (!user) return null;

  const header = (
    <header className="sticky top-0 z-40 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[108px] bg-gradient-to-b from-white via-white/90 to-transparent"
      />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-[22px] border border-[#e3e9ea] bg-white/90 px-2.5 py-2 shadow-[0_18px_45px_-26px_rgba(13,60,66,0.45)] backdrop-blur-xl sm:rounded-full sm:pl-4">
        <BrandLockup href="/doctor" />
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center rounded-full bg-[#fff7e8] px-3 py-1.5 text-[11px] font-medium text-[#9d7c3b] sm:inline-flex">
            Clinician access
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#f4f8f8] px-3 py-1.5 text-[11px] text-muted md:inline-flex">
            <span className="size-1.5 rounded-full bg-brand" />
            {user.name}
          </span>
          <Link
            href="/doctor"
            className="rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium transition hover:bg-[#f8fafb]"
          >
            Review queue
          </Link>
        </div>
      </div>
    </header>
  );

  if (isDenied || status === "forbidden") {
    return (
      <div className="min-h-svh bg-white">
        {header}
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-24 pt-20 text-center sm:px-6">
          <div className="grid size-16 place-items-center rounded-full bg-[#fff7e8] text-[#9d7c3b]">
            <DocIcon className="size-7" />
          </div>
          <h1 className="mt-6 font-serif text-[40px] leading-tight sm:text-5xl">
            Doctor access required
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
            This console is available to Healthlist clinicians. You&apos;re
            currently signed in as {user.email}.
          </p>
          <Button
            variant="outline"
            className="mt-9"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </main>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-svh bg-white">
        {header}
        <div className="flex justify-center py-24">
          <div className="size-7 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-svh bg-white">
        {header}
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-24 pt-20 text-center sm:px-6">
          <h1 className="font-serif text-[40px] leading-tight sm:text-5xl">
            Request not found
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
            This request could not be found. It may have been removed.
          </p>
          <Button className="mt-9" onClick={() => router.push("/doctor")}>
            Back to review queue
          </Button>
        </main>
      </div>
    );
  }

  if (status === "error" || !intake) {
    return (
      <div className="min-h-svh bg-white">
        {header}
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-24 pt-20 text-center sm:px-6">
          <h1 className="font-serif text-[40px] leading-tight sm:text-5xl">
            We couldn&apos;t open this request
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
            {error || "Please try again."}
          </p>
          <Button
            variant="outline"
            className="mt-9"
            onClick={() => {
              setStatus("loading");
              void load();
            }}
          >
            Try again
          </Button>
        </main>
      </div>
    );
  }

  const statusMeta = intakeStatusMeta(intake.status);
  const isReviewable = intake.status === "IN_REVIEW";

  return (
    <div className="min-h-svh bg-white">
      {header}

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 sm:px-6 sm:pt-10">
        <Link
          href="/doctor"
          className="text-sm text-muted transition hover:text-foreground"
        >
          ← Back to review queue
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              Intake review
            </p>
            <h1 className="mt-2 font-serif text-[40px] leading-tight tracking-[-0.02em] sm:text-[48px]">
              {doctorPatientLabel(intake)}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {doctorPatientMeta(intake)}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {intake.key}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge tone={statusMeta.tone}>
              {statusMeta.label}
            </StatusBadge>
            <p className="text-sm text-muted">
              {intake.submittedAt
                ? `Submitted ${formatDate(intake.submittedAt)}`
                : `Created ${formatDate(intake.createdAt ?? undefined)}`}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
          <section className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
            <h2 className="font-serif text-[27px] leading-tight">Products</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              What the patient asked to be reviewed.
            </p>

            <div className="mt-5 space-y-4">
              {intake.listings.map((listing) => {
                const name = doctorListingName(listing);

                return (
                  <div
                    key={listing.id}
                    className="flex gap-4 rounded-[18px] border border-line/70 p-3"
                  >
                    <ListingThumb
                      listing={listing}
                      className="h-[124px] w-[88px]"
                    />
                    <div className="min-w-0 flex-1 py-0.5">
                      <h3 className="font-serif text-[21px] leading-tight">
                        {name}
                      </h3>
                      <p className="mt-1 text-sm">{listing.brand}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {listing.reviews} reviews
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => setPreview(listing)}
                      >
                        View listing
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
            <h2 className="font-serif text-[27px] leading-tight">
              Patient assessment
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Answers shared for this review.
            </p>

            {assessmentState === "loading" ? (
              <div className="flex justify-center py-12">
                <div className="size-6 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
              </div>
            ) : assessmentState === "error" ? (
              <p className="mt-6 text-sm text-[#c25d5d]">{assessmentError}</p>
            ) : !assessment ? (
              <p className="mt-6 text-sm text-muted">
                This patient hasn&apos;t completed an assessment yet.
              </p>
            ) : assessment.assessmentAnswers.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                No assessment answers are on file.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {assessment.assessmentAnswers.map((answer, index) => (
                  <div
                    key={`${answer.assessmentQuestion.key}-${index}`}
                    className="py-3.5"
                  >
                    <p className="text-[13px] leading-relaxed text-muted">
                      {answer.assessmentQuestion.question}
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed">
                      {formatDoctorAnswer(
                        answer.answer,
                        answer.assessmentQuestion,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-sm text-muted">Decision</p>
              {isReviewable ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => openDecision("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-[#efd0d0] text-[#b85252] hover:bg-[#fdf1f1]"
                    onClick={() => openDecision("decline")}
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[15px] font-medium">
                    {intake.status === "APPROVED"
                      ? "Approved"
                      : intake.status === "REJECTED"
                        ? "Declined"
                        : "Not submitted yet"}
                  </p>
                  {intake.doctorRemark ? (
                    <p className="mt-2 rounded-[14px] bg-[#f6fafb] px-4 py-3 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-foreground">Note:</span>{" "}
                      {intake.doctorRemark}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <ListingPreview listing={preview} onClose={() => setPreview(null)} />

      <Modal
        open={Boolean(decision)}
        onClose={() => {
          if (!reviewing) setDecision(null);
        }}
        labelledBy="doctor-review-title"
      >
        {decision ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              {decision === "approve" ? "Approve request" : "Decline request"}
            </p>
            <h2
              id="doctor-review-title"
              className="mt-2 font-serif text-[32px] leading-tight"
            >
              {decision === "approve"
                ? "Approve this intake?"
                : "Decline this intake?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {decision === "approve"
                ? "The patient will be able to continue with their order."
                : "The patient will see the decision and any note you add below."}
            </p>

            <label
              htmlFor="doctor-review-remark"
              className="mt-6 mb-2 block text-sm text-foreground"
            >
              Note for the patient{" "}
              <span className="text-muted">(optional)</span>
            </label>
            <Textarea
              id="doctor-review-remark"
              placeholder={
                decision === "approve"
                  ? "e.g. Standard dosing is fine with your current medication."
                  : "e.g. Please speak with your GP before starting a GLP-1."
              }
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              disabled={reviewing}
            />

            {reviewError ? (
              <p className="mt-3 text-sm text-[#c25d5d]" role="alert">
                {reviewError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={reviewing}
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  decision === "decline" &&
                    "bg-[#b85252] hover:bg-[#a84747]",
                )}
                disabled={reviewing}
                onClick={() => void confirmDecision()}
              >
                {reviewing
                  ? "Saving…"
                  : decision === "approve"
                    ? "Approve"
                    : "Decline"}
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
