import { useState } from "react";
import { ProgressDots } from "./Shared";
import LevelUpGate from "./LevelUpGate";
import StepContact from "./StepContact";
import StepIdentity from "./StepIdentity";
import StepSelfie from "./StepSelfie";
import StepSummary from "./StepSummary";
import { Level2Data, emptyLevel2Data } from "./Types";

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
  const [data, setData] = useState<Level2Data>(emptyLevel2Data(verifiedPhone));

  const handleSubmit = async () => {
    // Wire this to your API route / server action, e.g.:
    // await fetch("/api/verification/level2", { method: "POST", body: buildPayload(data) });
    setSubmitted(true);
    onComplete();
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
      {steps[step]}
    </div>
  );
}