import type { ReactNode } from "react";

export type DataToolbarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  selectionSummary?: ReactNode;
  actions?: ReactNode;
  label?: string;
  className?: string;
};

export function DataToolbar({
  search,
  filters,
  selectionSummary,
  actions,
  label = "Data controls",
  className = ""
}: DataToolbarProps) {
  return (
    <div className={["dd-data-toolbar", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
      {search ? <div className="dd-data-toolbar__search">{search}</div> : null}
      {filters ? <div className="dd-data-toolbar__filters">{filters}</div> : null}
      {selectionSummary ? <div className="dd-data-toolbar__selection" aria-live="polite">{selectionSummary}</div> : null}
      {actions ? <div className="dd-data-toolbar__actions">{actions}</div> : null}
    </div>
  );
}
