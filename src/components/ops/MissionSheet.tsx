import { Link } from "react-router-dom";

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
}: {
  number?: string;
  status: string;
  eta?: string;
  points: MissionPoint[];
  href?: string;
}) => (
  <aside className="vita-sheet pointer-events-auto">
    <div className="vita-sheet__bezel">
      <div className="vita-sheet__core">
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

        {href ? (
          <Link to={href} className="vita-sheet__cta">
            Orienter le suivi
            <span>→</span>
          </Link>
        ) : null}
      </div>
    </div>
  </aside>
);

export default MissionSheet;
