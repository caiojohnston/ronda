import { useEffect, useState } from "react";
import type { HotspotDetail as HotspotDetailType, Turno } from "../types";
import { fetchHotspotDetail } from "../lib/api";
import { DAY_LABELS, TURNO_LABELS, riskColor, riskLabel } from "../lib/risk";

interface Props {
  hotspotId: number;
  day: number;
  turno: Turno;
  onClose: () => void;
}

export default function HotspotDetail({ hotspotId, day, turno, onClose }: Props) {
  const [detail, setDetail] = useState<HotspotDetailType | null>(null);

  useEffect(() => {
    setDetail(null);
    fetchHotspotDetail(hotspotId, day, turno).then(setDetail);
  }, [hotspotId, day, turno]);

  return (
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-slate-900/95 backdrop-blur border-l border-slate-700 text-slate-100 p-5 overflow-y-auto">
      <button onClick={onClose} className="text-slate-400 hover:text-white text-sm mb-4">
        ✕ Fechar
      </button>

      {!detail ? (
        <p className="text-slate-400 text-sm">Carregando…</p>
      ) : (
        <>
          <h2 className="text-xl font-bold">{detail.name}</h2>
          <p className="text-slate-400 text-sm mb-4">{detail.neighborhood}</p>

          <div
            className="rounded-lg p-3 mb-4 border"
            style={{ borderColor: riskColor(detail.intensity), background: `${riskColor(detail.intensity)}1a` }}
          >
            <p className="text-xs text-slate-300">
              {DAY_LABELS[detail.day]} · {TURNO_LABELS[detail.turno]}
            </p>
            <p className="text-2xl font-bold" style={{ color: riskColor(detail.intensity) }}>
              Risco {riskLabel(detail.intensity)}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <ProbabilityBar label="Roubo" value={detail.roubo_probability} />
            <ProbabilityBar label="Furto" value={detail.furto_probability} />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-3">{detail.methodology}</p>
        </>
      )}
    </div>
  );
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
