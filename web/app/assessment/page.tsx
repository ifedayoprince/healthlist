"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { CheckIcon, LockIcon } from "@/components/icons";
import {
  AuthShell,
  Button,
  CheckField,
  Field,
  Input,
  Textarea,
} from "@/components/ui";
import { Select } from "@/components/select";
import { consumeRedirect } from "@/lib/redirect";
import { BLOOD_GROUPS, CONDITION_OPTIONS } from "@/lib/site";
import { useApp } from "@/lib/store";
import type { AssessmentInput } from "@/lib/types";

const SEX_OPTIONS = ["Female", "Male", "Intersex", "Prefer not to say"];

function isDateOfBirth(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1;
}

function formatDateOfBirth(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function AssessmentPage() {
  return (
    <RequireAuth>
      <AssessmentFlow />
    </RequireAuth>
  );
}

function AssessmentFlow() {
  const { sessionUser, assessmentFor, completeAssessment } = useApp();
  const router = useRouter();
  const existing = sessionUser ? assessmentFor(sessionUser.id) : undefined;

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AssessmentInput>({
    fullName: sessionUser?.name ?? "",
    sex: "",
    heightCm: "",
    weightKg: "",
    dateOfBirth: "",
    bloodGroup: "",
    conditions: [],
    otherCondition: "",
    medications: "",
    allergies: "",
    smoking: "",
    alcohol: "",
    pregnancy: "",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const update = <K extends keyof AssessmentInput>(
    key: K,
    value: AssessmentInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleCondition = (condition: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      conditions: checked
        ? [...current.conditions, condition]
        : current.conditions.filter((item) => item !== condition),
    }));
  };

  const finish = () => {
    completeAssessment({ ...form, fullName: form.fullName.trim() });
    const next = consumeRedirect();
    router.replace(next && next !== "/assessment" ? next : "/dashboard");
  };

  const goNext = () => {
    setError("");

    if (step === 0 && !form.fullName.trim()) {
      setError("Add your full name to continue.");
      return;
    }

    if (step === 1) {
      if (!isDateOfBirth(form.dateOfBirth)) {
        setError("Enter your date of birth as DD/MM/YYYY.");
        return;
      }
      if (!form.bloodGroup) {
        setError("Select your blood group, or choose Unknown.");
        return;
      }
    }

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    finish();
  };

  if (existing) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-mint-soft text-brand">
            <CheckIcon className="size-7" />
          </div>
          <h1 className="mt-6 font-serif text-[42px] leading-tight sm:text-5xl">
            Assessment complete
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            Your health assessment is already on file. Our doctors use it to
            review every intake request you submit.
          </p>
          <Button
            size="lg"
            className="mt-10 w-full max-w-[526px]"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col pb-10 pt-10 sm:pt-14">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[42px] leading-none tracking-[-0.02em] sm:text-[54px]">
            Assessment
          </h1>
          <span className="pt-2 text-sm text-muted">{step + 1} of 5</span>
        </div>

        <div key={step} className="step-in mt-10 sm:mt-12">
          {step === 0 ? (
            <div className="space-y-8 sm:space-y-12">
              <Field label="Full name" htmlFor="fullName">
                <Input
                  id="fullName"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                />
              </Field>

              <Field label="Biological sex" htmlFor="sex">
                <Select
                  id="sex"
                  placeholder="Select from dropdown"
                  options={SEX_OPTIONS}
                  value={form.sex}
                  onValueChange={(value) => update("sex", value)}
                />
              </Field>

              <div className="grid gap-7 sm:grid-cols-2">
                <Field label="Height (cm)" htmlFor="height">
                  <Input
                    id="height"
                    inputMode="numeric"
                    placeholder="168"
                    value={form.heightCm}
                    onChange={(event) =>
                      update("heightCm", event.target.value.replace(/\D/g, ""))
                    }
                  />
                </Field>
                <Field label="Weight (kg)" htmlFor="weight">
                  <Input
                    id="weight"
                    inputMode="numeric"
                    placeholder="68"
                    value={form.weightKg}
                    onChange={(event) =>
                      update("weightKg", event.target.value.replace(/\D/g, ""))
                    }
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-8 sm:space-y-12">
              <Field label="Date of Birth" htmlFor="dob">
                <Input
                  id="dob"
                  inputMode="numeric"
                  autoComplete="bday"
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    update("dateOfBirth", formatDateOfBirth(event.target.value))
                  }
                />
              </Field>

              <Field label="Blood Group" htmlFor="bloodGroup">
                <Select
                  id="bloodGroup"
                  placeholder="Select from dropdown"
                  options={BLOOD_GROUPS}
                  value={form.bloodGroup}
                  onValueChange={(value) => update("bloodGroup", value)}
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <p
                id="conditions-label"
                className="text-[17px] leading-relaxed text-foreground"
              >
                Have you been diagnosed with any of these? (heart, kidney,
                liver, diabetes, high blood pressure, thyroid, mental health,
                other)
              </p>
              <div
                role="group"
                aria-labelledby="conditions-label"
                className="mt-5 space-y-0.5"
              >
                {CONDITION_OPTIONS.map((condition) => (
                  <CheckField
                    key={condition}
                    label={condition}
                    checked={form.conditions.includes(condition)}
                    onChange={(checked) =>
                      toggleCondition(condition, checked)
                    }
                  />
                ))}
              </div>

              {form.conditions.includes("Other") ? (
                <Input
                  className="mt-4"
                  placeholder="Tell us a little more"
                  value={form.otherCondition}
                  onChange={(event) =>
                    update("otherCondition", event.target.value)
                  }
                />
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-8 sm:space-y-12">
              <Field
                label="Current medications"
                htmlFor="medications"
                hint="Include prescriptions, over-the-counter medicines, and supplements."
              >
                <Textarea
                  id="medications"
                  placeholder="e.g. Lisinopril 5mg, once daily"
                  value={form.medications}
                  onChange={(event) =>
                    update("medications", event.target.value)
                  }
                />
              </Field>

              <Field
                label="Known allergies"
                htmlFor="allergies"
                hint="Include medicine, food, and other allergies."
              >
                <Textarea
                  id="allergies"
                  placeholder="e.g. Penicillin, peanuts"
                  value={form.allergies}
                  onChange={(event) => update("allergies", event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-8 sm:space-y-12">
              <Field label="Do you smoke or vape?" htmlFor="smoking">
                <Select
                  id="smoking"
                  placeholder="Select from dropdown"
                  options={["No", "Occasionally", "Daily"]}
                  value={form.smoking}
                  onValueChange={(value) => update("smoking", value)}
                />
              </Field>

              <Field
                label="How often do you drink alcohol?"
                htmlFor="alcohol"
              >
                <Select
                  id="alcohol"
                  placeholder="Select from dropdown"
                  options={["Never", "Rarely", "Occasionally", "Weekly", "Daily"]}
                  value={form.alcohol}
                  onValueChange={(value) => update("alcohol", value)}
                />
              </Field>

              <Field
                label="Are you pregnant, planning a pregnancy, or breastfeeding?"
                htmlFor="pregnancy"
              >
                <Select
                  id="pregnancy"
                  placeholder="Select from dropdown"
                  options={["Not applicable", "No", "Yes"]}
                  value={form.pregnancy}
                  onValueChange={(value) => update("pregnancy", value)}
                />
              </Field>

              <div className="flex gap-3 rounded-[16px] bg-[#f4fafb] p-4 text-[13px] leading-relaxed text-[#2c656d]">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  These answers are shared only with the doctor reviewing your
                  intake requests. Your assistant never sees them.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 text-sm text-[#c25d5d]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-16 flex items-center justify-between gap-4 pb-2 sm:mt-32">
          <Button
            size="lg"
            variant="soft"
            className="w-[44%] px-4 !text-[19px] sm:w-[174px]"
            disabled={step === 0}
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="w-[44%] px-4 !text-[19px] sm:w-[174px]"
            onClick={goNext}
          >
            {step === 4 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
