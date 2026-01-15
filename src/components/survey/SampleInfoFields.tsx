interface SampleInfoFieldsProps {
  sampleType: "A" | "B" | "C";
  name?: string;
  code: string;
  onNameChange?: (value: string) => void;
  onCodeChange: (value: string) => void;
  errors?: {
    name?: string;
    code?: string;
  };
}

export const SampleInfoFields = ({
  sampleType,
  name,
  code,
  onNameChange,
  onCodeChange,
  errors,
}: SampleInfoFieldsProps) => {
  const showNameField = sampleType === "A";

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6 p-4 bg-muted/50 rounded-lg border border-border">
      {showNameField && onNameChange && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Name of the Person <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name || ""}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your full name"
            className={`survey-input ${errors?.name ? "border-destructive" : ""}`}
            required
          />
          {errors?.name && (
            <p className="text-sm text-destructive mt-1">{errors.name}</p>
          )}
        </div>
      )}
      <div className={showNameField ? "" : "md:col-span-2"}>
        <label className="block text-sm font-medium text-foreground mb-2">
          Sample Code <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={`Enter code for Sample ${sampleType}`}
          className={`survey-input ${errors?.code ? "border-destructive" : ""}`}
          required
        />
        {errors?.code && (
          <p className="text-sm text-destructive mt-1">{errors.code}</p>
        )}
      </div>
    </div>
  );
};
