import { apiFetch } from "./client";
import type {
  ApiListing,
  DoctorAssessment,
  DoctorAssessmentAnswer,
  DoctorIntake,
  DoctorIntakeListPayload,
  DoctorReviewInput,
} from "./types";

export async function listDoctorIntakes(): Promise<DoctorIntake[]> {
  const payload = await apiFetch<DoctorIntakeListPayload>(
    "/doctor-console/intakes?limit=50",
  );
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

export function getDoctorIntake(intakeId: string) {
  return apiFetch<DoctorIntake>(
    `/doctor-console/intakes/${encodeURIComponent(intakeId)}`,
  );
}

export function getDoctorAssessment(userId: string) {
  return apiFetch<DoctorAssessment>(
    `/doctor-console/assessment/${encodeURIComponent(userId)}`,
  );
}

export function submitDoctorReview(
  intakeId: string,
  input: DoctorReviewInput,
) {
  return apiFetch<{ success: string }>(
    `/doctor-console/intakes/${encodeURIComponent(intakeId)}/review`,
    {
      method: "POST",
      json: input,
    },
  );
}

export function doctorListingName(listing: ApiListing) {
  return (
    listing.documents[0]?.name ||
    listing.slug ||
    listing.brand ||
    "Product"
  );
}

export function doctorIntakeTitle(intake: DoctorIntake) {
  const names = intake.listings.map(doctorListingName).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "Intake request";
}

export function doctorPatientLabel(intake: DoctorIntake) {
  return intake.user?.name || "Patient";
}

export function doctorPatientMeta(intake: DoctorIntake) {
  if (intake.user?.email) return intake.user.email;
  if (intake.userId) return `Patient ID ${intake.userId.slice(0, 8)}…`;
  return "Patient details unavailable";
}

export function formatDoctorAnswer(
  answer: DoctorAssessmentAnswer["answer"],
  question?: DoctorAssessmentAnswer["assessmentQuestion"],
) {
  if (answer === null || answer === undefined) return "—";
  if (typeof answer === "boolean") return answer ? "Yes" : "No";
  if (Array.isArray(answer)) {
    if (answer.length === 0) return "—";
    const labels = answer
      .filter((item) => item !== "")
      .map((item) => {
        const option = question?.options?.find((entry) => entry.key === item);
        return option?.value ?? item;
      });
    return labels.join(", ") || "—";
  }
  return answer.trim() || "—";
}
