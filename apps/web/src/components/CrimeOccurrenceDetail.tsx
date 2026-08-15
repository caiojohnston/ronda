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
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-white border-l border-[#bdc3c7] text-[#2c3e50] p-5 overflow-y-auto">
      <button onClick={onClose} className="text-[#7f8c8d] hover:text-[#2c3e50] text-sm mb-4">
        ✕ Fechar
      </button>

      <p className="text-xs uppercase tracking-wide text-[#e74c3c] font-semibold mb-1">Ocorrência registrada</p>
      <h2 className="text-xl font-bold">{bairro}</h2>
      <p className="text-[#7f8c8d] text-sm mb-4">{date}</p>

      <div className="rounded p-3 mb-4 border-l-4 border-[#e74c3c] bg-[#ecf0f1]">
        <p className="text-xs text-[#7f8c8d] mb-1">Tipo</p>
        <p className="text-base font-semibold text-[#e74c3c]">{label}</p>
      </div>

      <p className="text-xs text-[#7f8c8d] leading-relaxed border-t border-[#bdc3c7] pt-3">
        Ocorrência individual real já registrada — não é o índice de risco estimado (círculos
        coloridos por intensidade), é um boletim de ocorrência de verdade. Fonte: CODEC/SEGUP-PA.
      </p>
    </div>
  );
}
