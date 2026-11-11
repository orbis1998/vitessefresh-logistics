import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

export type MissionPoint = {
  kind: "pickup" | "parcel" | "driver" | "drop";
  title: string;
  detail: string;
  active?: boolean;
};

const META: Record<MissionPoint["kind"], { mark: string; label: string }> = {
  pickup: { mark: "vita-sheet__mark--pickup", label: "Ramassage" },
  parcel: { mark: "vita-sheet__mark--parcel", label: "Colis" },
  driver: { mark: "vita-sheet__mark--driver", label: "Livreur" },
  drop: { mark: "vita-sheet__mark--drop", label: "Destinataire" },
};

const MissionSheet = ({
  number,
  status,
  eta,
  points,
  href,
  ctaLabel = "Orienter le suivi",
  children,
  wide,
  defaultCollapsed = true,
}: {
  number?: string;
  status: string;
  eta?: string;
  points: MissionPoint[];
  href?: string;
  ctaLabel?: string;
  children?: ReactNode;
  wide?: boolean;
  /** Peek mode so the map stays visible (Yango-style). */
  defaultCollapsed?: boolean;
}) => {
  const [open, setOpen] = useState(!defaultCollapsed);
  const active = points.find((p) => p.active) || points[points.length - 1];

  return (
    <aside className={`vita-sheet pointer-events-auto ${wide ? "vita-sheet--wide" : ""} ${open ? "is-open" : "is-peek"}`}>
      <div className="vita-sheet__bezel">
        <div className="vita-sheet__core">
          <button
            type="button"
            className="vita-sheet__handle"
            aria-expanded={open}
            aria-label={open ? "Réduire le panneau" : "Ouvrir le panneau"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            {open ? <ChevronDown className="w-4 h-4 text-white/35" /> : <ChevronUp className="w-4 h-4 text-white/35" />}
          </button>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/35">Course</p>
              <p className="font-heading text-[22px] font-bold tracking-tight text-primary tabular-nums truncate">
                {number || "—"}
              </p>
            </div>
            {eta ? (
              <p className="shrink-0 font-heading text-lg font-semibold tabular-nums">{eta}</p>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-white/70">{status}</p>

          {!open && active ? (
            <div className="mt-3 grid grid-cols-[18px_1fr] gap-3 items-start">
              <span className={`vita-sheet__mark relative static left-0 top-0 ${META[active.kind].mark}`} />
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/40">{META[active.kind].label}</p>
                <p className="text-[13px] font-medium truncate">{active.title}</p>
                <p className="text-[12px] text-white/45 truncate">{active.detail}</p>
              </div>
            </div>
          ) : null}

          {open ? (
            <ol className="vita-sheet__list">
              {points.map((p) => (
                <li key={p.kind} className={p.active ? "is-active" : ""}>
                  <span className={`vita-sheet__mark ${META[p.kind].mark}`} />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/40">{META[p.kind].label}</p>
                    <p className="text-[13px] font-medium truncate">{p.title}</p>
                    <p className="text-[12px] text-white/45 truncate">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {children ? <div className="vita-sheet__actions">{children}</div> : null}

          {href && open ? (
            <Link to={href} className="vita-sheet__cta">
              {ctaLabel}
              <span>→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default MissionSheet;
