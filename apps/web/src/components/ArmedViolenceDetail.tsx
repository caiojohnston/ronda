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
    <div className="absolute top-0 right-0 z-10 h-full w-full max-w-sm bg-slate-900/95 backdrop-blur border-l border-slate-700 text-slate-100 p-5 overflow-y-auto">
      <button onClick={onClose} className="text-slate-400 hover:text-white text-sm mb-4">
        ✕ Fechar
      </button>

      <p className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-1">Violência armada</p>
      <h2 className="text-xl font-bold">{p.neighborhood ?? "Bairro não informado"}</h2>
      <p className="text-slate-400 text-sm mb-4">{date}</p>

      <div className="rounded-lg p-3 mb-4 border border-amber-500/40 bg-amber-500/10">
        <p className="text-xs text-slate-300 mb-1">Motivo registrado</p>
        <p className="text-base font-semibold text-amber-300">{p.main_reason ?? "Não informado"}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-[11px] text-slate-400">Vítimas</p>
          <p className="text-lg font-bold">{p.victim_count}</p>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-[11px] text-slate-400">Mortes</p>
          <p className="text-lg font-bold">{p.death_count}</p>
        </div>
      </div>

      {p.address && <p className="text-xs text-slate-400 mb-4 leading-relaxed">{p.address}</p>}

      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-3">
        Ocorrência específica já registrada — não é estimativa de risco, e não é o mesmo fenômeno que o
        índice de roubo/furto (aqui é tiroteio/violência armada). Fonte:{" "}
        <a
          href="https://fogocruzado.org.br"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-amber-300"
        >
          Instituto Fogo Cruzado
        </a>
        .
      </p>
    </div>
  );
}
