import type {
  AppState,
  Assessment,
  IntakeRequest,
  Listing,
  PaymentMethod,
  User,
} from "./types";

export const LISTINGS: Listing[] = [
  {
    id: "glp1-pen",
    name: "GLP-1 Pen",
    brand: "GoldLife Peps",
    price: 189,
    reviews: 5,
    rating: 4.8,
    category: "Weight management",
    description:
      "A once-weekly GLP-1 injection pen prescribed for weight management. Ships cold-chain in discreet packaging, with a doctor review before dispatch.",
    highlights: [
      "Once-weekly dosing",
      "Cold-chain, discreet delivery",
      "Doctor review required before dispatch",
    ],
    additionalQuestions: [
      {
        key: "diabetes_meds",
        label:
          "Are you currently taking insulin or any other diabetes medication?",
        type: "select",
        options: ["No", "Yes — insulin", "Yes — other diabetes medication"],
        required: true,
      },
      {
        key: "pancreatitis",
        label: "Have you ever had pancreatitis or gallbladder disease?",
        type: "select",
        options: ["No", "Yes"],
        required: true,
      },
      {
        key: "prior_glp1",
        label: "Have you taken a GLP-1 medication in the last three months?",
        type: "select",
        options: ["No", "Yes"],
        required: true,
      },
    ],
  },
  {
    id: "semaglutide-drops",
    name: "Semaglutide Oral Drops",
    brand: "Nova Labs",
    price: 129,
    reviews: 8,
    rating: 4.4,
    category: "Weight management",
    description:
      "A daily oral semaglutide drop, formulated for people who prefer to avoid injections. Requires a doctor review before your first order.",
    highlights: [
      "Daily oral dose",
      "No needles",
      "Doctor review required before dispatch",
    ],
    additionalQuestions: [
      {
        key: "thyroid_history",
        label: "Do you have a personal or family history of thyroid cancer?",
        type: "select",
        options: ["No", "Yes"],
        required: true,
      },
      {
        key: "current_weight",
        label: "What is your current weight?",
        type: "text",
        placeholder: "e.g. 78 kg",
        required: true,
      },
    ],
  },
  {
    id: "nad-injection",
    name: "NAD+ Injection",
    brand: "Peak Vitality",
    price: 149,
    reviews: 12,
    rating: 4.6,
    category: "Longevity",
    description:
      "A NAD+ injection protocol designed to support cellular energy and recovery. Supplied with everything needed for at-home use.",
    highlights: [
      "Weekly protocol",
      "Lab-tested batch",
      "Cold-chain delivery",
    ],
  },
  {
    id: "berberine",
    name: "Berberine Complex",
    brand: "Terra Health",
    price: 39,
    reviews: 21,
    rating: 4.7,
    category: "Metabolic health",
    description:
      "A daily berberine and chromium blend that supports healthy blood sugar metabolism as part of a balanced routine.",
    highlights: [
      "Berberine + chromium blend",
      "60 capsules per bottle",
      "Third-party tested",
    ],
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3 + K2",
    brand: "Terra Health",
    price: 24,
    reviews: 34,
    rating: 4.9,
    category: "Daily essentials",
    description:
      "A daily vitamin D3 and K2 supplement to support bone health and immune function, formulated for easy absorption.",
    highlights: [
      "D3 + K2 in one capsule",
      "90 capsules per bottle",
      "Third-party tested",
    ],
  },
];

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hours = 0) {
  return new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString();
}

const users: User[] = [
  {
    id: "usr_amara",
    name: "Amara Okafor",
    email: "amara@example.com",
    createdAt: daysAgo(32),
  },
  {
    id: "usr_daniel",
    name: "Daniel Mensah",
    email: "daniel@example.com",
    createdAt: daysAgo(58),
  },
  {
    id: "usr_sofia",
    name: "Sofia Reyes",
    email: "sofia@example.com",
    createdAt: daysAgo(21),
  },
];

const assessments: Assessment[] = [
  {
    id: "asm_usr_amara",
    userId: "usr_amara",
    completedAt: daysAgo(31),
    fullName: "Amara Okafor",
    sex: "Female",
    heightCm: "168",
    weightKg: "82",
    dateOfBirth: "14/03/1992",
    bloodGroup: "O+",
    conditions: ["High blood pressure"],
    otherCondition: "",
    medications: "Lisinopril 5mg, once daily",
    allergies: "Penicillin",
    smoking: "No",
    alcohol: "Occasionally",
    pregnancy: "No",
  },
  {
    id: "asm_usr_daniel",
    userId: "usr_daniel",
    completedAt: daysAgo(57),
    fullName: "Daniel Mensah",
    sex: "Male",
    heightCm: "181",
    weightKg: "76",
    dateOfBirth: "02/11/1985",
    bloodGroup: "A-",
    conditions: [],
    otherCondition: "",
    medications: "None",
    allergies: "None",
    smoking: "No",
    alcohol: "Rarely",
    pregnancy: "Not applicable",
  },
  {
    id: "asm_usr_sofia",
    userId: "usr_sofia",
    completedAt: daysAgo(20),
    fullName: "Sofia Reyes",
    sex: "Female",
    heightCm: "163",
    weightKg: "79",
    dateOfBirth: "27/07/1996",
    bloodGroup: "B+",
    conditions: ["Thyroid"],
    otherCondition: "",
    medications: "Levothyroxine 50mcg, once daily",
    allergies: "None",
    smoking: "No",
    alcohol: "Never",
    pregnancy: "No",
  },
];

const intakes: IntakeRequest[] = [
  {
    id: "IR-4821",
    userId: "usr_amara",
    status: "pending",
    source: "assistant",
    createdAt: daysAgo(2, 3),
    products: [{ listingId: "glp1-pen" }],
  },
  {
    id: "IR-4822",
    userId: "usr_amara",
    status: "approved",
    source: "assistant",
    createdAt: daysAgo(16),
    submittedAt: daysAgo(15),
    reviewedAt: daysAgo(14),
    products: [{ listingId: "vitamin-d3" }, { listingId: "berberine" }],
    doctorNote: "Approved. Standard dosing is fine with your current medication.",
  },
  {
    id: "IR-4823",
    userId: "usr_daniel",
    status: "pending",
    source: "assistant",
    createdAt: daysAgo(1),
    submittedAt: daysAgo(0, 20),
    products: [
      { listingId: "nad-injection" },
      { listingId: "berberine" },
    ],
  },
  {
    id: "IR-4824",
    userId: "usr_sofia",
    status: "declined",
    source: "assistant",
    createdAt: daysAgo(6),
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    products: [{ listingId: "semaglutide-drops" }],
    additionalAnswers: {
      "semaglutide-drops:thyroid_history": "No",
      "semaglutide-drops:current_weight": "79 kg",
    },
    doctorNote:
      "Declined for now because of the thyroid history on file. Please speak with your GP before starting a GLP-1.",
  },
];

const paymentMethods: PaymentMethod[] = [
  {
    id: "pm_amara_visa",
    userId: "usr_amara",
    brand: "Visa",
    last4: "4242",
    expiry: "04/28",
    isDefault: true,
  },
  {
    id: "pm_daniel_mc",
    userId: "usr_daniel",
    brand: "Mastercard",
    last4: "8210",
    expiry: "11/27",
    isDefault: true,
  },
];

export function buildSeedState(): AppState {
  return {
    users: users.map((user) => ({ ...user })),
    assessments: assessments.map((assessment) => ({
      ...assessment,
      conditions: [...assessment.conditions],
    })),
    intakes: intakes.map((intake) => ({
      ...intake,
      products: intake.products.map((product) => ({ ...product })),
      additionalAnswers: intake.additionalAnswers
        ? { ...intake.additionalAnswers }
        : undefined,
    })),
    paymentMethods: paymentMethods.map((method) => ({ ...method })),
    sessionUserId: null,
  };
}
