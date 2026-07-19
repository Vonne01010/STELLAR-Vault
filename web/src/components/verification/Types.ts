// Shared types for the verification wizard components.
// If lib/auth/verification.ts already defines a VerificationLevel enum / user shape,
// import and reuse those instead of the local types below where they overlap.

export type IdentityMode = "id" | "endorsement";

// Added "barangay" to match lib/auth/verification.ts's alternativeIdType enum
// (which includes 'barangay_cert'). Values stay short here; mapped to the
// lib's snake_case enum in toAlternativeIdType() below.
export type IdType = "school" | "employer" | "coop" | "barangay";

export interface Level2Data {
  phone: string; // already verified at Level 1, read-only here
  email: string;
  identityMode: IdentityMode;
  idType: IdType | "";
  idNumber: string;
  idImage: File | null;
  endorsementCode: string;
  selfieCaptured: boolean; // client-side: "user went through the selfie capture UI"
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

// --- Mapping to lib/auth/verification.ts's persisted shape ---
//
// alternativeIdVerified / selfieVerified are server-confirmed booleans and
// should NOT be set from this mapping — only the backend sets them true,
// after actually checking the ID/endorsement or running liveness on the selfie.
// This function only produces the *submission* payload, not the verified flags.

type AlternativeIdType =
  | "school_id"
  | "employer_id"
  | "cooperative_id"
  | "barangay_cert"
  | "endorsement";

const idTypeMap: Record<IdType, AlternativeIdType> = {
  school: "school_id",
  employer: "employer_id",
  coop: "cooperative_id",
  barangay: "barangay_cert",
};

export function toAlternativeIdType(data: Level2Data): AlternativeIdType | undefined {
  if (data.identityMode === "endorsement") return "endorsement";
  if (data.idType === "") return undefined;
  return idTypeMap[data.idType];
}