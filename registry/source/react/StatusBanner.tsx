import type { ReactNode } from "react";

export type StatusBannerProps = {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function StatusBanner({
  variant = "info",
  title,
  children,
  action,
  className = ""
}: StatusBannerProps) {
  const role = variant === "danger" ? "alert" : "status";
  return (
    <section className={["dd-banner", "dd-banner--" + variant, className].filter(Boolean).join(" ")} role={role}>
      {title ? <strong className="dd-banner__title">{title}</strong> : null}
      <div className="dd-banner__message">{children}</div>
      {action}
    </section>
  );
}
