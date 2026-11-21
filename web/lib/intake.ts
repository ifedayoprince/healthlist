import { LISTINGS } from "./mock-data";
import type { AdditionalQuestion, IntakeRequest, Listing } from "./types";

export function listingById(id: string): Listing | undefined {
  return LISTINGS.find((listing) => listing.id === id);
}

export function intakeListings(intake: IntakeRequest) {
  return intake.products
    .map((product) => listingById(product.listingId))
    .filter((listing): listing is Listing => Boolean(listing));
}

export type MissingQuestion = {
  listing: Listing;
  question: AdditionalQuestion;
  answerKey: string;
};

export function answerKey(listingId: string, questionKey: string) {
  return `${listingId}:${questionKey}`;
}

export function missingQuestions(intake: IntakeRequest): MissingQuestion[] {
  const missing: MissingQuestion[] = [];

  for (const product of intake.products) {
    const listing = listingById(product.listingId);
    if (!listing?.additionalQuestions) continue;

    for (const question of listing.additionalQuestions) {
      const key = answerKey(listing.id, question.key);
      if (!intake.additionalAnswers?.[key]?.trim()) {
        missing.push({ listing, question, answerKey: key });
      }
    }
  }

  return missing;
}

export function displayStatus(intake: IntakeRequest): {
  label: string;
  tone: "pending" | "success" | "danger" | "neutral";
} {
  if (intake.status === "approved") return { label: "Approved", tone: "success" };
  if (intake.status === "declined") return { label: "Declined", tone: "danger" };
  if (intake.status === "cancelled") return { label: "Cancelled", tone: "neutral" };

  return intake.submittedAt
    ? { label: "In review", tone: "pending" }
    : { label: "Pending", tone: "pending" };
}
