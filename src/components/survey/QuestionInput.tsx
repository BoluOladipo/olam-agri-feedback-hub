import { useState } from "react";

interface QuestionInputProps {
  questionNumber: number;
  questionText: string;
  questionType: "radio" | "text" | "textarea";
  options?: string[];
  value: string;
  onChange: (value: string) => void;
  disabledOptions?: string[];
  required?: boolean;
  error?: string;
}

export const QuestionInput = ({
  questionNumber,
  questionText,
  questionType,
  options = [],
  value,
  onChange,
  disabledOptions = [],
  required = true,
  error,
}: QuestionInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderInput = () => {
    switch (questionType) {
      case "radio":
        return (
          <div className="grid gap-2 md:grid-cols-2">
            {options.map((option) => {
              const isSelected = value === option;
              const isDisabled = disabledOptions.includes(option);
              const isOK = option.toLowerCase() === "ok" || option === "Neither Like nor Dislike";
              
              return (
                <label
                  key={option}
                  className={`
                    radio-option
                    ${isSelected ? "selected" : ""}
                    ${isDisabled && !isOK ? "disabled" : ""}
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${questionNumber}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => !isDisabled || isOK ? onChange(option) : null}
                    disabled={isDisabled && !isOK}
                    className="flex-shrink-0"
                  />
                  <span className={`text-sm ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter your comments here..."
            className={`survey-textarea ${isFocused ? "ring-2 ring-primary" : ""} ${error ? "border-destructive" : ""}`}
            required={required}
          />
        );

      case "text":
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter your answer..."
            className={`survey-input ${isFocused ? "ring-2 ring-primary" : ""} ${error ? "border-destructive" : ""}`}
            required={required}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
            {questionNumber}
          </span>
          <span className="text-foreground font-medium leading-relaxed">
            {questionText}
            {required && <span className="text-destructive ml-1">*</span>}
          </span>
        </span>
      </label>
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};
