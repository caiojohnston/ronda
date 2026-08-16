import { RISK_LEVELS } from "../lib/risk";

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded p-3 text-[var(--text-primary)] text-[11px] space-y-1.5">
      <p className="font-semibold text-xs mb-1">Legenda</p>
      {RISK_LEVELS.map((level) => (
        <div key={level.label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: level.color }} />
          <span>Risco {level.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
        <span className="w-2.5 h-2.5 shrink-0" style={{ background: "#e67e22", transform: "rotate(45deg)" }} />
        <span>Violência armada</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#e74c3c" }} />
        <span>Ocorrência real</span>
      </div>
    </div>
  );
}
