import type { ReactNode } from "react";

export type AppShellProps = {
  header?: ReactNode;
  navigation: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  mainId?: string;
  className?: string;
};

export function AppShell({
  header,
  navigation,
  children,
  aside,
  mainId = "main-content",
  className = ""
}: AppShellProps) {
  return (
    <div className={["dd-app-shell", className].filter(Boolean).join(" ")}>
      {header ? <header className="dd-app-shell__header">{header}</header> : null}
      <div className="dd-app-shell__body">
        <nav className="dd-app-shell__nav" aria-label="Primary">{navigation}</nav>
        <main className="dd-app-shell__main" id={mainId}>{children}</main>
        {aside ? <aside>{aside}</aside> : null}
      </div>
    </div>
  );
}
