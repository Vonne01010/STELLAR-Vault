import { useState } from "react";
import { authFetch } from "@/lib/wallet";
import { ProgressDots } from "./Shared";
import LevelUpGate from "./LevelUpGate";
import StepContact from "./StepContact";
import StepIdentity from "./StepIdentity";
import StepSelfie from "./StepSelfie";
import StepSummary from "./StepSummary";
import { Level2Data, emptyLevel2Data, toAlternativeIdType } from "./Types";

interface Level2VerificationProps {
  currentPoints: number; // pull from useAuth() / user record
  verifiedPhone: string; // pull from useAuth() / user record
  onClose: () => void;
  onComplete: () => void; // called after successful submit, e.g. to refresh useAuth() state
}

export default function Level2Verification({
  currentPoints,
  verifiedPhone,
  onClose,
  onComplete,
}: Level2VerificationProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<Level2Data>(emptyLevel2Data(verifiedPhone));

  const handleSubmit = async () => {
    setSubmitError(null);

    const payload = {
      alternativeIdType: toAlternativeIdType(data),
      idNumber: data.identityMode === "id" ? data.idNumber : undefined,
      endorsementCode:
        data.identityMode === "endorsement" ? data.endorsementCode : undefined,
      email: data.email || undefined,
      selfieCaptured: data.selfieCaptured,
    };

    const form = new FormData();
    form.append("payload", JSON.stringify(payload));
    // TODO: no file storage wired up yet — idImage is not sent.
    // if (data.idImage) form.append("idImage", data.idImage);

    try {
      const res = await authFetch("/api/verification/level2", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setSubmitError(err?.error ?? "Submission failed. Please try again.");
        return;
      }

      setSubmitted(true);
      onComplete();
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
  };

  if (!unlocked) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-3xl p-6 bg-white shadow-xl shadow-neutral-200/50">
        <LevelUpGate
          currentPoints={currentPoints}
          onClose={onClose}
          onUnlocked={() => setUnlocked(true)}
        />
      </div>
    );
  }

  const steps = [
    <StepContact key="contact" data={data} setData={setData} onNext={() => setStep(1)} onBack={onClose} />,
    <StepIdentity key="identity" data={data} setData={setData} onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <StepSelfie key="selfie" data={data} setData={setData} onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <StepSummary
      key="summary"
      data={data}
      onBack={() => setStep(2)}
      submitted={submitted}
      onSubmit={handleSubmit}
    />,
  ];

  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl p-6 bg-white shadow-xl shadow-neutral-200/50">
      {!submitted && <ProgressDots step={step} total={4} />}
      {submitError && (
        <p className="text-xs text-red-500 mb-3 px-1">{submitError}</p>
      )}
      {steps[step]}
    </div>
  );
}