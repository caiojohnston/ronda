import type { ArmedViolenceFeature } from "../types";

interface Props {
  event: ArmedViolenceFeature;
  onClose: () => void;
}

export default function ArmedViolenceDetail({ event, onClose }: Props) {
  const { properties: p } = event;
  const date = new Date(p.occurred_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-[var(--surface)] border-l border-[var(--border)] text-[var(--text-primary)] p-5 overflow-y-auto">
      <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-4">
        ✕ Fechar
      </button>

      <p className="text-xs uppercase tracking-wide text-[#e67e22] font-semibold mb-1">Violência armada</p>
      <h2 className="text-xl font-bold">{p.neighborhood ?? "Bairro não informado"}</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-4">{date}</p>

      <div className="rounded p-3 mb-4 border-l-4 border-[#e67e22] bg-[var(--surface-alt)]">
        <p className="text-xs text-[var(--text-secondary)] mb-1">Motivo registrado</p>
        <p className="text-base font-semibold text-[#e67e22]">{p.main_reason ?? "Não informado"}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded bg-[var(--surface-alt)] p-3">
          <p className="text-[11px] text-[var(--text-secondary)]">Vítimas</p>
          <p className="text-lg font-bold">{p.victim_count}</p>
        </div>
        <div className="rounded bg-[var(--surface-alt)] p-3">
          <p className="text-[11px] text-[var(--text-secondary)]">Mortes</p>
          <p className="text-lg font-bold">{p.death_count}</p>
        </div>
      </div>

      {p.address && <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">{p.address}</p>}

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-3">
        Ocorrência específica já registrada — não é estimativa de risco, e não é o mesmo fenômeno que o
        índice de roubo/furto (aqui é tiroteio/violência armada). Fonte:{" "}
        <a
          href="https://fogocruzado.org.br"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[#e67e22]"
        >
          Instituto Fogo Cruzado
        </a>
        .
      </p>
    </div>
  );
}
