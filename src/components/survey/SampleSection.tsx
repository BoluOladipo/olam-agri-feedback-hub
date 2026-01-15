import { ReactNode } from "react";

interface SampleSectionProps {
  sampleLabel: string;
  sampleType: "A" | "B" | "C";
  children: ReactNode;
}

export const SampleSection = ({ sampleLabel, sampleType, children }: SampleSectionProps) => {
  const getSampleColor = () => {
    switch (sampleType) {
      case "A": return "bg-primary/10 border-primary/30";
      case "B": return "bg-blue-500/10 border-blue-500/30";
      case "C": return "bg-green-500/10 border-green-500/30";
      default: return "bg-muted border-border";
    }
  };

  return (
    <div className="sample-card slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className={`px-4 py-2 rounded-full border-2 ${getSampleColor()}`}>
          <span className="font-semibold text-foreground">{sampleLabel}</span>
        </div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
