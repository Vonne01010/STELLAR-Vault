import { useState } from "react";
import { Building2, Users, Upload, ChevronRight } from "lucide-react";
import { StepHeader, PrimaryButton, FieldLabel, inputClass } from "./Shared";
import { StepProps, IdentityMode } from "./Types";

export default function StepIdentity({ data, setData, onNext, onBack }: StepProps) {
  const [mode, setMode] = useState<IdentityMode>(data.identityMode || "id");

  const canContinue =
    mode === "id" ? !!data.idType && !!data.idNumber : data.endorsementCode.length >= 6;

  return (
    <div>
      <StepHeader
        title="Verify who you are"
        subtitle="Choose one path. This unlocks cross-chain transactions and raises your trust score."
        onBack={onBack}
      />

      <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-neutral-100 rounded-2xl">
        <button
          onClick={() => setMode("id")}
          className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mode === "id" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
          }`}
        >
          <Building2 size={15} /> ID upload
        </button>
        <button
          onClick={() => setMode("endorsement")}
          className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mode === "endorsement" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
          }`}
        >
          <Users size={15} /> Endorsement
        </button>
      </div>

      {mode === "id" ? (
        <div className="space-y-4 mb-8">
          <div>
            <FieldLabel>ID type</FieldLabel>
            <select
              value={data.idType}
              onChange={(e) => setData({ ...data, idType: e.target.value as any })}
              className={inputClass}
            >
              <option value="">Select an ID type</option>
              <option value="school">School ID</option>
              <option value="employer">Employer ID</option>
              <option value="coop">Cooperative membership ID</option>
              <option value="barangay">Barangay certificate</option>
            </select>
          </div>
          <div>
            <FieldLabel>ID number</FieldLabel>
            <input
              value={data.idNumber}
              onChange={(e) => setData({ ...data, idNumber: e.target.value })}
              placeholder="e.g. 2024-00891"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Photo of ID</FieldLabel>
            <label className="w-full py-6 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center gap-1.5 text-neutral-400 hover:border-orange-300 hover:text-orange-400 transition-colors cursor-pointer">
              <Upload size={20} />
              <span className="text-xs font-medium">
                {data.idImage ? data.idImage.name : "Tap to upload"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setData({ ...data, idImage: e.target.files?.[0] ?? null })}
              />
            </label>
            <p className="text-xs text-neutral-400 mt-1.5">
              Only your name and ID number are stored. The photo is encrypted and used for one-time verification.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          <div>
            <FieldLabel>Endorsement code</FieldLabel>
            <input
              value={data.endorsementCode}
              onChange={(e) => setData({ ...data, endorsementCode: e.target.value.toUpperCase() })}
              placeholder="e.g. NODE-7XQ2"
              className={inputClass + " tracking-widest font-mono"}
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Ask a Level 3 community node or partner organization to vouch for you and share their code.
            </p>
          </div>
        </div>
      )}

      <PrimaryButton
        onClick={() => {
          setData({ ...data, identityMode: mode });
          onNext();
        }}
        disabled={!canContinue}
        icon={ChevronRight}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}