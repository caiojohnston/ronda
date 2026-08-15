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
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-white border-l border-[#bdc3c7] text-[#2c3e50] p-5 overflow-y-auto">
      <button onClick={onClose} className="text-[#7f8c8d] hover:text-[#2c3e50] text-sm mb-4">
        ✕ Fechar
      </button>

      {!detail ? (
        <p className="text-[#7f8c8d] text-sm">Carregando…</p>
      ) : (
        <>
          <h2 className="text-xl font-bold">{detail.name}</h2>
          <p className="text-[#7f8c8d] text-sm mb-4">{detail.neighborhood}</p>

          <div
            className="rounded p-3 mb-4 border-l-4 bg-[#ecf0f1]"
            style={{ borderLeftColor: riskColor(detail.intensity) }}
          >
            <p className="text-xs text-[#7f8c8d]">
              {detail.temporal_data ? `${DAY_LABELS[detail.day]} · ${TURNO_LABELS[detail.turno]}` : "Índice anual (2025) · sem variação por dia/turno"}
            </p>
            <p className="text-2xl font-bold" style={{ color: riskColor(detail.intensity) }}>
              Risco {riskLabel(detail.intensity)}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <ProbabilityBar label="Roubo" value={detail.roubo_probability} />
            <ProbabilityBar label="Furto" value={detail.furto_probability} />
          </div>

          <p className="text-xs text-[#7f8c8d] leading-relaxed border-t border-[#bdc3c7] pt-3">{detail.methodology}</p>
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
      <div className="h-1.5 rounded bg-[#ecf0f1]">
        <div className="h-full rounded bg-[#2980b9]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
