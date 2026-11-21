export const MCP_URL =
  process.env.NEXT_PUBLIC_MCP_URL ?? "https://mcp.healthlist.app/mcp";

export const DEMO_EMAIL = "amara@example.com";
export const DEMO_PASSWORD = "healthlist";

export const CONDITION_OPTIONS = [
  "Heart",
  "Kidney",
  "Liver",
  "Diabetes",
  "High blood pressure",
  "Thyroid",
  "Mental health",
  "Other",
] as const;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
] as const;
