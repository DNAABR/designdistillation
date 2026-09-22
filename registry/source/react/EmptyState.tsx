import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  headingLevel = 2,
  className = ""
}: EmptyStateProps) {
  const Heading = ("h" + headingLevel) as "h2" | "h3" | "h4";
  return (
    <section className={["dd-empty-state", className].filter(Boolean).join(" ")}>
      <Heading className="dd-empty-state__title">{title}</Heading>
      <div className="dd-empty-state__description">{description}</div>
      {primaryAction || secondaryAction ? (
        <div className="dd-empty-state__actions">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
