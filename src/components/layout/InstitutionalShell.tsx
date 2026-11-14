import { Link } from "@/i18n/routing";

type Cta = { href: "/qualify"; label: string };

/**
 * Navy header for public inner pages.
 * Quiet gold edge only — no energy canvas and no particle core.
 */
export function InstitutionalShell({
  eyebrow,
  title,
  lead,
  cta,
  children,
  prose = false,
  bleed = false,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  cta?: Cta;
  children?: React.ReactNode;
  prose?: boolean;
  bleed?: boolean;
}) {
  return (
    <div className="institutional-page">
      <header className="institutional-hero">
        <div className="shell">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          {cta ? (
            <p className="institutional-hero-cta">
              <Link className="btn btn-primary" href={cta.href}>
                {cta.label}
              </Link>
            </p>
          ) : null}
        </div>
      </header>
      {children ? (
        bleed ? (
          children
        ) : (
          <section className="section institutional-body">
            <div className={prose ? "shell legal-prose" : "shell"}>{children}</div>
          </section>
        )
      ) : null}
    </div>
  );
}
