import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id?: string;
  label: string;
  description?: string;
  error?: string;
};

export function TextField({ id, label, description, error, className = "", ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = description ? inputId + "-description" : undefined;
  const errorId = error ? inputId + "-error" : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="dd-field">
      <label className="dd-field__label" htmlFor={inputId}>{label}</label>
      {description ? <div className="dd-field__description" id={descriptionId}>{description}</div> : null}
      <input
        id={inputId}
        className={["dd-input", className].filter(Boolean).join(" ")}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <div className="dd-field__error" id={errorId}>{error}</div> : null}
    </div>
  );
}
