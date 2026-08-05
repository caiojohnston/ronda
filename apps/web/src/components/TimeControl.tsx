import { DAY_LABELS, TURNO_LABELS } from "../lib/risk";
import type { Turno } from "../types";

interface Props {
  day: number;
  turno: Turno;
  autoMode: boolean;
  onChangeDay: (day: number) => void;
  onChangeTurno: (turno: Turno) => void;
  onToggleAuto: () => void;
}

const TURNOS: Turno[] = ["madrugada", "manha", "tarde", "noite"];

export default function TimeControl({ day, turno, autoMode, onChangeDay, onChangeTurno, onToggleAuto }: Props) {
  return (
    <div className="absolute top-4 left-4 z-10 w-80 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700 shadow-xl p-4 text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold text-lg tracking-tight">Ronda</h1>
        <button
          onClick={onToggleAuto}
          className={`text-xs px-2 py-1 rounded-full border ${
            autoMode ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" : "bg-slate-800 border-slate-600 text-slate-300"
          }`}
        >
          {autoMode ? "● Agora" : "Simulando"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAY_LABELS.map((label, idx) => (
          <button
            key={label}
            onClick={() => onChangeDay(idx)}
            disabled={autoMode}
            title={label}
            className={`text-[10px] py-1 rounded ${
              day === idx ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
            } disabled:opacity-40`}
          >
            {label.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {TURNOS.map((t) => (
          <button
            key={t}
            onClick={() => onChangeTurno(t)}
            disabled={autoMode}
            className={`text-xs py-1.5 rounded ${
              turno === t ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
            } disabled:opacity-40`}
          >
            {TURNO_LABELS[t].split(" · ")[0]}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 leading-snug">
        Índice de risco histórico por local — não é ocorrência em tempo real.
      </p>
    </div>
  );
}
