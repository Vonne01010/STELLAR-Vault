// Shared types for the verification wizard components.
// If lib/auth/verification.ts already defines a VerificationLevel enum / user shape,
// import and reuse those instead of the local types below where they overlap.

export type IdentityMode = "id" | "endorsement";

export type IdType = "school" | "employer" | "coop";

export interface Level2Data {
  phone: string; // already verified at Level 1, read-only here
  email: string;
  identityMode: IdentityMode;
  idType: IdType | "";
  idNumber: string;
  idImage: File | null;
  endorsementCode: string;
  selfieCaptured: boolean;
}

export const emptyLevel2Data = (phone: string): Level2Data => ({
  phone,
  email: "",
  identityMode: "id",
  idType: "",
  idNumber: "",
  idImage: null,
  endorsementCode: "",
  selfieCaptured: false,
});

export interface StepProps {
  data: Level2Data;
  setData: (data: Level2Data) => void;
  onNext: () => void;
  onBack: () => void;
}