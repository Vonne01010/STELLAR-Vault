import { useState } from "react";
import { Camera, RotateCcw, Check, ChevronRight } from "lucide-react";
import { StepHeader, PrimaryButton } from "./Shared";
import { StepProps } from "./Types";

type ScanStatus = "idle" | "scanning" | "done";

export default function StepSelfie({ data, setData, onNext, onBack }: StepProps) {
  const [status, setStatus] = useState<ScanStatus>(data.selfieCaptured ? "done" : "idle");

  const runScan = () => {
    setStatus("scanning");
    // Replace with your real liveness SDK call (e.g. face-api.js blink/head-turn check).
    // On success, also upload/verify the captured frame server-side before setting selfieCaptured.
    setTimeout(() => {
      setStatus("done");
      setData({ ...data, selfieCaptured: true });
    }, 1800);
  };

  return (
    <div>
      <StepHeader
        title="Take a quick selfie"
        subtitle="We'll check that a real person is present. This isn't stored anywhere except to confirm the match with your ID."
        onBack={onBack}
      />

      <div className="flex flex-col items-center mb-8">
        <div
          className={`w-48 h-48 rounded-full border-4 flex items-center justify-center mb-5 transition-all ${
            status === "done"
              ? "border-green-400 bg-green-50"
              : status === "scanning"
              ? "border-orange-400 bg-orange-50 animate-pulse"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          {status === "done" ? (
            <Check size={48} className="text-green-500" />
          ) : status === "scanning" ? (
            <RotateCcw size={36} className="text-orange-400 animate-spin" />
          ) : (
            <Camera size={36} className="text-neutral-300" />
          )}
        </div>

        <p className="text-sm font-medium text-neutral-600">
          {status === "done"
            ? "Liveness confirmed"
            : status === "scanning"
            ? "Hold still, checking…"
            : "Center your face in the frame"}
        </p>
        {status === "idle" && (
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-[220px]">
            We'll ask you to blink or turn your head slightly
          </p>
        )}
      </div>

      {status !== "done" ? (
        <PrimaryButton onClick={runScan} disabled={status === "scanning"} icon={Camera}>
          {status === "scanning" ? "Scanning…" : "Start face scan"}
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={onNext} icon={ChevronRight}>
          Continue
        </PrimaryButton>
      )}
    </div>
  );
}