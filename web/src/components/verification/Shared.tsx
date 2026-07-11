import { ChevronLeft } from "lucide-react";

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-8 bg-orange-500" : i < step ? "w-1.5 bg-orange-300" : "w-1.5 bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}

export function StepHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm mb-4 -ml-1 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{subtitle}</p>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
        disabled
          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
          : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.99] shadow-sm shadow-orange-200"
      }`}
    >
      {children}
      {Icon && <Icon size={16} />}
    </button>
  );
}

export function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
      {children} {optional && <span className="text-neutral-300 normal-case font-normal">(optional)</span>}
    </label>
  );
}

export const inputClass =
  "w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all";