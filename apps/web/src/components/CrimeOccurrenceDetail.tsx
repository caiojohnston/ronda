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
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-[var(--surface)] border-l border-[var(--border)] text-[var(--text-primary)] p-5 overflow-y-auto">
      <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-4">
        ✕ Fechar
      </button>

      <p className="text-xs uppercase tracking-wide text-[#e74c3c] font-semibold mb-1">Ocorrência registrada</p>
      <h2 className="text-xl font-bold">{bairro}</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-4">{date}</p>

      <div className="rounded p-3 mb-4 border-l-4 border-[#e74c3c] bg-[var(--surface-alt)]">
        <p className="text-xs text-[var(--text-secondary)] mb-1">Tipo</p>
        <p className="text-base font-semibold text-[#e74c3c]">{label}</p>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-3">
        Ocorrência individual real já registrada — não é o índice de risco estimado (círculos
        coloridos por intensidade), é um boletim de ocorrência de verdade. Fonte: CODEC/SEGUP-PA.
      </p>
    </div>
  );
}
