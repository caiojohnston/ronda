import type { CrimeOccurrenceProperties } from "../types";

interface Props {
  occurrence: CrimeOccurrenceProperties;
  onClose: () => void;
}

export default function CrimeOccurrenceDetail({ occurrence, onClose }: Props) {
  const date = new Date(occurrence.occurred_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const label = occurrence.crime_type === "roubo" ? "Roubo" : "Furto";
  const bairro = occurrence.bairro
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

  return (
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-slate-900/95 backdrop-blur border-l border-slate-700 text-slate-100 p-5 overflow-y-auto">
      <button onClick={onClose} className="text-slate-400 hover:text-white text-sm mb-4">
        ✕ Fechar
      </button>

      <p className="text-xs uppercase tracking-wide text-red-400 font-semibold mb-1">Ocorrência registrada</p>
      <h2 className="text-xl font-bold">{bairro}</h2>
      <p className="text-slate-400 text-sm mb-4">{date}</p>

      <div className="rounded-lg p-3 mb-4 border border-red-500/40 bg-red-500/10">
        <p className="text-xs text-slate-300 mb-1">Tipo</p>
        <p className="text-base font-semibold text-red-300">{label}</p>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-3">
        Ocorrência individual real já registrada — não é o índice de risco estimado (bolhas
        pulsantes), é um boletim de ocorrência de verdade. Fonte: CODEC/SEGUP-PA.
      </p>
    </div>
  );
}
