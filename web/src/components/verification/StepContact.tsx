import { Mail, Check } from "lucide-react";
import { StepHeader, PrimaryButton, FieldLabel, inputClass } from "./Shared";
import { StepProps } from "./Types";
import { ChevronRight } from "lucide-react";

export default function StepContact({ data, setData, onNext, onBack }: StepProps) {
  const emailValid = data.email === "" || /\S+@\S+\.\S+/.test(data.email);

  return (
    <div>
      <StepHeader
        title="Confirm your contact details"
        subtitle="Your mobile number is already verified from Level 1. Add an email so we can reach you about vault activity."
        onBack={onBack}
      />

      <div className="space-y-4 mb-8">
        <div>
          <FieldLabel>Mobile number</FieldLabel>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-100">
            <span className="text-sm text-neutral-700 font-medium">{data.phone}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <Check size={14} /> Verified
            </span>
          </div>
        </div>

        <div>
          <FieldLabel optional>Email address</FieldLabel>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="you@example.com"
              className={inputClass + " pl-11"}
            />
          </div>
          {!emailValid && <p className="text-xs text-red-500 mt-1.5">Enter a valid email address</p>}
        </div>
      </div>

      <PrimaryButton onClick={onNext} disabled={!emailValid} icon={ChevronRight}>
        Continue
      </PrimaryButton>
    </div>
  );
}