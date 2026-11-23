"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DocIcon } from "@/components/icons";
import { RequireAuth } from "@/components/require-auth";
import {
  BrandLockup,
  Button,
  Modal,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { ApiError, errorMessage } from "@/lib/api/client";
import {
  doctorIntakeTitle,
  doctorListingName,
  doctorPatientLabel,
  doctorPatientMeta,
  formatDoctorAnswer,
  getDoctorAssessment,
  listDoctorIntakes,
  submitDoctorReview,
} from "@/lib/api/doctor";
import type { DoctorAssessment, DoctorIntake } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { rememberRedirect } from "@/lib/redirect";
import { cn, formatDate } from "@/lib/utils";

export default function DoctorPage() {
  return (
    <RequireAuth>
      <DoctorConsole />
    </RequireAuth>
  );
}

function DoctorConsole() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<
    "loading" | "ready" | "error" | "forbidden"
  >("loading");
  const [intakes, setIntakes] = useState<DoctorIntake[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [assessmentIntake, setAssessmentIntake] =
    useState<DoctorIntake | null>(null);
  const [assessment, setAssessment] = useState<DoctorAssessment>(null);
  const [assessmentState, setAssessmentState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [assessmentError, setAssessmentError] = useState("");

  const [decision, setDecision] = useState<{
    intake: DoctorIntake;
    isApproved: boolean;
  } | null>(null);
  const [remark, setRemark] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listDoctorIntakes();
      setIntakes(data);
      setError("");
      setState("ready");
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        (cause.status === 401 || cause.status === 403)
      ) {
        setState("forbidden");
        return;
      }
      setError(errorMessage(cause));
      setState("error");
    }
  }, []);

  const isDenied = user?.role === "PATIENT";

  useEffect(() => {
    if (isDenied) return;
    // Loading from the API is an external-system sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [isDenied, load]);

  const openAssessment = async (intake: DoctorIntake) => {
    setAssessmentIntake(intake);
    setAssessment(null);
    setAssessmentError("");
    setAssessmentState("loading");

    if (!intake.userId) {
      setAssessmentState("error");
      setAssessmentError("This intake has no patient attached.");
      return;
    }

    try {
      const data = await getDoctorAssessment(intake.userId);
      setAssessment(data);
      setAssessmentState("ready");
    } catch (cause) {
      setAssessmentError(errorMessage(cause));
      setAssessmentState("error");
    }
  };

  const openDecision = (intake: DoctorIntake, isApproved: boolean) => {
    setDecision({ intake, isApproved });
    setRemark("");
    setReviewError("");
  };

  const confirmDecision = async () => {
    if (!decision) return;
    setReviewing(true);
    setReviewError("");

    try {
      await submitDoctorReview(decision.intake.id, {
        isApproved: decision.isApproved,
        remark: remark.trim() || undefined,
      });
      setIntakes((current) =>
        current.filter((item) => item.id !== decision.intake.id),
      );
      setNotice(
        decision.isApproved
          ? "Request approved. The patient can now see the decision."
          : "Request declined. The patient can now see the decision.",
      );
      setDecision(null);
      setRemark("");
    } catch (cause) {
      setReviewError(errorMessage(cause));
    } finally {
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
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-[22px] border border-[#e3e9ea] bg-white/90 px-2.5 py-2 shadow-[0_18px_45px_-26px_rgba(13,60,66,0.45)] backdrop-blur-xl sm:rounded-full sm:pl-4">
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
            href="/dashboard"
            className="rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium transition hover:bg-[#f8fafb]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );

  if (isDenied || state === "forbidden") {
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
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
            <Button
              onClick={() => {
                rememberRedirect("/doctor");
                void signOut().then(() => router.replace("/login"));
              }}
            >
              Switch account
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-white">
      {header}

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 sm:px-6 sm:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Healthlist clinicians
        </p>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
          Intake reviews
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
          Review the products patients requested, check the assessment they
          completed, then approve or decline the request.
        </p>

        {notice ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-[16px] bg-[#eef9f2] px-4 py-3 text-sm text-[#2f7d52]">
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="text-xs font-medium underline underline-offset-4"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[34px] leading-none">
              {state === "ready" ? intakes.length : "—"}
            </span>
            <span className="text-sm text-muted">
              {intakes.length === 1
                ? "request awaiting review"
                : "requests awaiting review"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f8f8] px-3 py-1.5 text-[11px] text-muted">
            <span className="size-1.5 rounded-full bg-brand" />
            Live queue
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {state === "loading" ? (
            <>
              <div className="h-48 animate-pulse rounded-[22px] bg-[#f4f7f7]" />
              <div className="h-48 animate-pulse rounded-[22px] bg-[#f4f7f7]" />
            </>
          ) : state === "error" ? (
            <div className="rounded-[22px] border border-[#f0dada] bg-[#fdf8f8] px-6 py-10 text-center">
              <h2 className="font-serif text-2xl">
                We couldn&apos;t load the review queue
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {error}
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setState("loading");
                  void load();
                }}
              >
                Try again
              </Button>
            </div>
          ) : intakes.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] px-6 py-14 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-mint-soft text-brand">
                <DocIcon className="size-6" />
              </div>
              <h2 className="mt-5 font-serif text-[28px] leading-tight">
                The queue is clear
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                Requests appear here after a patient submits them for review.
              </p>
            </div>
          ) : (
            intakes.map((intake) => (
              <DoctorCase
                key={intake.id}
                intake={intake}
                onAssessment={() => void openAssessment(intake)}
                onDecision={(isApproved) =>
                  openDecision(intake, isApproved)
                }
              />
            ))
          )}
        </div>
      </main>

      <Modal
        open={Boolean(assessmentIntake)}
        onClose={() => setAssessmentIntake(null)}
        labelledBy="assessment-modal-title"
        className="sm:max-w-[640px]"
      >
        {assessmentIntake ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                  Patient assessment
                </p>
                <h2
                  id="assessment-modal-title"
                  className="mt-2 font-serif text-[32px] leading-tight"
                >
                  {doctorPatientLabel(assessmentIntake)}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {doctorPatientMeta(assessmentIntake)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentIntake(null)}
                className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-[#f2f4f5] hover:text-foreground"
              >
                Close
              </button>
            </div>

            {assessmentState === "loading" ? (
              <div className="flex justify-center py-10">
                <div className="size-6 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
              </div>
            ) : assessmentState === "error" ? (
              <p className="mt-6 text-sm text-[#c25d5d]">
                {assessmentError}
              </p>
            ) : !assessment ? (
              <p className="mt-6 text-sm text-muted">
                This patient hasn&apos;t completed an assessment yet.
              </p>
            ) : assessment.assessmentAnswers.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                No assessment answers are on file.
              </p>
            ) : (
              <div className="mt-5 divide-y divide-line">
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

            <Button
              className="mt-6 w-full"
              onClick={() => setAssessmentIntake(null)}
            >
              Done
            </Button>
          </>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(decision)}
        onClose={() => {
          if (!reviewing) setDecision(null);
        }}
        labelledBy="decision-modal-title"
      >
        {decision ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              {decision.isApproved ? "Approve request" : "Decline request"}
            </p>
            <h2
              id="decision-modal-title"
              className="mt-2 font-serif text-[32px] leading-tight"
            >
              {decision.isApproved
                ? "Approve this intake?"
                : "Decline this intake?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {decision.isApproved
                ? `The patient will be able to continue with ${doctorIntakeTitle(decision.intake)}.`
                : "The patient will see the decision and any note you add below."}
            </p>

            <label
              htmlFor="doctor-remark"
              className="mt-6 mb-2 block text-sm text-foreground"
            >
              Note for the patient{" "}
              <span className="text-muted">(optional)</span>
            </label>
            <Textarea
              id="doctor-remark"
              placeholder={
                decision.isApproved
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
                  !decision.isApproved &&
                    "bg-[#b85252] hover:bg-[#a84747]",
                )}
                disabled={reviewing}
                onClick={() => void confirmDecision()}
              >
                {reviewing
                  ? "Saving…"
                  : decision.isApproved
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

function DoctorCase({
  intake,
  onAssessment,
  onDecision,
}: {
  intake: DoctorIntake;
  onAssessment: () => void;
  onDecision: (isApproved: boolean) => void;
}) {
  return (
    <div className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {intake.key}
            </span>
            <StatusBadge tone="pending">In review</StatusBadge>
          </div>
          <h2 className="mt-3 font-serif text-[26px] leading-tight">
            {doctorPatientLabel(intake)}
          </h2>
          <p className="text-sm text-muted">{doctorPatientMeta(intake)}</p>
        </div>
        <p className="text-sm text-muted">
          {intake.submittedAt
            ? `Submitted ${formatDate(intake.submittedAt)}`
            : `Created ${formatDate(intake.createdAt ?? undefined)}`}
        </p>
      </div>

      <h3 className="mt-5 font-serif text-[21px] leading-tight">
        {doctorIntakeTitle(intake)}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {intake.listings.map((listing) => (
          <span
            key={listing.id}
            className="rounded-full bg-[#f4f6f7] px-3 py-1.5 text-sm text-[#3f4649]"
          >
            {doctorListingName(listing)}
            <span className="text-muted"> · {listing.brand}</span>
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button size="sm" variant="outline" onClick={onAssessment}>
          <DocIcon className="size-4" />
          View assessment
        </Button>
        <Button size="sm" onClick={() => onDecision(true)}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecision(false)}
          className="border-[#efd0d0] text-[#b85252] hover:bg-[#fdf1f1]"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
