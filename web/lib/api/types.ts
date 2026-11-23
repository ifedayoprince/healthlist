export type ApiUser = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  role?: "PATIENT" | "DOCTOR";
};

export type SigninInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthenticateResponse = {
  isFirstSignup: boolean;
  name: string;
  email: string;
  hasPendingAssessment: boolean;
};

export type QuestionOption = {
  key: string;
  value: string;
};

export type QuestionType =
  | "MULTI_SELECT"
  | "YES_NO"
  | "YES_NO_TEXT"
  | "TEXT_LIST";

export type AssessmentAnswer = {
  id: string;
  answer: string | string[] | boolean | null;
  answeredAt: string;
};

export type AssessmentQuestion = {
  id: string;
  key: string;
  question: string;
  isPreliminary: boolean;
  isRequired: boolean;
  type: QuestionType;
  options: QuestionOption[] | null;
  assessmentAnswers: AssessmentAnswer[];
};

export type AssessmentResponse = {
  preliminary: {
    pending: AssessmentQuestion[];
    completed: AssessmentQuestion[];
  };
};

export type IntakeStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type ListingDocument = {
  id: string;
  listingId: string;
  version: number;
  isActive: boolean;
  name: string;
  excerpt: string;
  metadata: {
    price: number;
    category: string[];
  } | null;
  body: string;
  searchTags: string[];
  createdAt: string | null;
};

export type ApiListing = {
  id: string;
  slug: string;
  brand: string;
  reviews: number;
  productImage: string | null;
  additionalQuestions: string[];
  createdAt: string | null;
  documents: ListingDocument[];
};

export type IntakeSession = {
  id: string;
  key: string;
  status: IntakeStatus;
  doctorRemark: string | null;
  createdAt: string | null;
  submittedAt: string | null;
  listings: ApiListing[];
  questions: AssessmentQuestion[];
};

export type IntakeListListing = {
  id?: string;
  slug?: string;
  brand?: string;
  name?: string;
  productImage?: string | null;
  documents?: Array<{
    name?: string;
    excerpt?: string;
    metadata?: {
      price?: number;
      category?: string[];
    } | null;
  }>;
};

export type IntakeListEntry = {
  id: string;
  key: string;
  status: IntakeStatus;
  createdAt: string | null;
  submittedAt?: string | null;
  doctorRemark?: string | null;
  listings?: IntakeListListing[];
};

export type IntakeListPayload =
  | IntakeListEntry[]
  | {
      data?: IntakeListEntry[];
      intakes?: IntakeListEntry[];
      items?: IntakeListEntry[];
      cursor?: string | null;
    };

export type SubmitIntakeAnswer = {
  questionKey: string;
  answer: string[];
};

export type SubmitIntakeInput = {
  intakeKey: string;
  answers: SubmitIntakeAnswer[];
  removedListings: string[];
};

export type DoctorIntake = {
  id: string;
  key: string;
  userId: string | null;
  status: IntakeStatus;
  doctorRemark: string | null;
  createdAt: string | null;
  submittedAt: string | null;
  statusChangedAt?: string | null;
  listings: ApiListing[];
  user?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
};

export type DoctorIntakeListPayload =
  | DoctorIntake[]
  | {
      data?: DoctorIntake[];
      cursor?: string | null;
    };

export type DoctorAssessmentAnswer = {
  answer: string | string[] | boolean | null;
  answeredAt: string;
  assessmentQuestion: {
    id?: string;
    key: string;
    question: string;
    type: QuestionType;
    options: QuestionOption[] | null;
    isRequired: boolean;
    isPreliminary?: boolean;
  };
};

export type DoctorAssessment = {
  id: string;
  assessmentAnswers: DoctorAssessmentAnswer[];
} | null;

export type DoctorReviewInput = {
  isApproved: boolean;
  remark?: string;
};
