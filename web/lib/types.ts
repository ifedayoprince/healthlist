export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Assessment = {
  id: string;
  userId: string;
  completedAt: string;
  fullName: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  dateOfBirth: string;
  bloodGroup: string;
  conditions: string[];
  otherCondition: string;
  medications: string;
  allergies: string;
  smoking: string;
  alcohol: string;
  pregnancy: string;
};

export type AssessmentInput = Omit<
  Assessment,
  "id" | "userId" | "completedAt"
>;

export type AdditionalQuestion = {
  key: string;
  label: string;
  type: "select" | "text";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type Listing = {
  id: string;
  name: string;
  brand: string;
  price: number;
  reviews: number;
  rating: number;
  category: string;
  description: string;
  highlights: string[];
  additionalQuestions?: AdditionalQuestion[];
};

export type IntakeProduct = {
  listingId: string;
};

export type IntakeStatus = "pending" | "approved" | "declined" | "cancelled";

export type IntakeRequest = {
  id: string;
  userId: string;
  status: IntakeStatus;
  source: "assistant";
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  doctorNote?: string;
  products: IntakeProduct[];
  additionalAnswers?: Record<string, string>;
};

export type PaymentMethod = {
  id: string;
  userId: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

export type AppState = {
  users: User[];
  assessments: Assessment[];
  intakes: IntakeRequest[];
  paymentMethods: PaymentMethod[];
  sessionUserId: string | null;
};
