import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "quiet";
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function ActionButton({
  variant = "primary",
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  className = "",
  ...props
}: ActionButtonProps) {
  const classes = ["dd-button", "dd-button--" + variant, className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}
