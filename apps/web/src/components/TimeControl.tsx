import { useEffect, useState } from "react";
import { DAY_LABELS, TURNO_LABELS } from "../lib/risk";
import { fetchCrimeOccurrenceBairros } from "../lib/api";
import type { City, CrimeOccurrenceFilters, Turno } from "../types";

interface Props {
  cities: City[];
  city: City;
  day: number;
  turno: Turno;
  autoMode: boolean;
  showArmedViolence: boolean;
  armedViolenceCount: number | null;
  showOccurrences: boolean;
  occurrenceCount: number | null;
  occurrenceFilters: CrimeOccurrenceFilters;
  onChangeCity: (slug: string) => void;
  onChangeDay: (day: number) => void;
  onChangeTurno: (turno: Turno) => void;
  onToggleAuto: () => void;
  onToggleArmedViolence: () => void;
  onToggleOccurrences: () => void;
  onChangeOccurrenceFilters: (patch: Partial<CrimeOccurrenceFilters>) => void;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

const TURNOS: Turno[] = ["madrugada", "manha", "tarde", "noite"];

export default function TimeControl({
  cities,
  city,
  day,
  turno,
  autoMode,
  showArmedViolence,
  armedViolenceCount,
  showOccurrences,
  occurrenceCount,
  occurrenceFilters,
  onChangeCity,
  onChangeDay,
  onChangeTurno,
  onToggleAuto,
  onToggleArmedViolence,
  onToggleOccurrences,
  onChangeOccurrenceFilters,
}: Props) {
  const hasTemporalData = city.has_temporal_data;
  const controlsDisabled = autoMode || !hasTemporalData;
  const [bairros, setBairros] = useState<string[]>([]);

  useEffect(() => {
    fetchCrimeOccurrenceBairros(city.slug).then((res) => setBairros(res.bairros));
  }, [city.slug]);

  return (
    <div className="absolute top-4 left-4 z-10 w-80 rounded bg-white border border-[#bdc3c7] shadow-sm p-4 text-[#2c3e50]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold text-lg tracking-tight">Ronda</h1>
        <button
          onClick={onToggleAuto}
          disabled={!hasTemporalData}
          className={`text-xs px-2 py-1 rounded border disabled:opacity-40 ${
            autoMode ? "bg-[#2980b9] border-[#2980b9] text-white" : "bg-[#ecf0f1] border-[#bdc3c7] text-[#7f8c8d]"
          }`}
        >
          {autoMode ? "● Agora" : "Simulando"}
        </button>
      </div>

      {cities.length > 1 && (
        <select
          value={city.slug}
          onChange={(e) => onChangeCity(e.target.value)}
          className="w-full mb-3 text-xs bg-white border border-[#bdc3c7] rounded px-2 py-1.5 text-[#2c3e50]"
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} · {c.state}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAY_LABELS.map((label, idx) => (
          <button
            key={label}
            onClick={() => onChangeDay(idx)}
            disabled={controlsDisabled}
            title={label}
            className={`text-[10px] py-1 rounded ${
              day === idx ? "bg-[#2980b9] text-white" : "bg-[#ecf0f1] text-[#7f8c8d]"
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
            disabled={controlsDisabled}
            className={`text-xs py-1.5 rounded ${
              turno === t ? "bg-[#2980b9] text-white" : "bg-[#ecf0f1] text-[#7f8c8d]"
            } disabled:opacity-40`}
          >
            {TURNO_LABELS[t].split(" · ")[0]}
          </button>
        ))}
      </div>

      {hasTemporalData ? (
        <p className="text-[11px] text-[#7f8c8d] mt-3 leading-snug">
          Índice de risco histórico por local — não é ocorrência em tempo real.
        </p>
      ) : (
        <p className="text-[11px] text-[#c0392b] mt-3 leading-snug">
          {city.name}: fonte oficial não publica dado por turno/dia da semana. Índice fixo,
          baseado no total de ocorrências de 2025 por delegacia.
        </p>
      )}

      <div className="border-t border-[#bdc3c7] mt-3 pt-3">
        <button
          onClick={onToggleArmedViolence}
          className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded border ${
            showArmedViolence
              ? "bg-[#e67e22] border-[#e67e22] text-white"
              : "bg-[#ecf0f1] border-[#bdc3c7] text-[#7f8c8d]"
          }`}
        >
          <span>◆ Violência armada (Fogo Cruzado)</span>
          <span>{showArmedViolence ? "ligado" : "desligado"}</span>
        </button>
        {showArmedViolence && (
          <p className="text-[11px] text-[#7f8c8d] mt-2 leading-snug">
            {armedViolenceCount === null
              ? "Carregando…"
              : armedViolenceCount === 0
                ? `Sem eventos registrados em ${city.name} nos últimos 6 meses (ou fonte ainda não cobre esta cidade).`
                : `${armedViolenceCount} evento(s) nos últimos 6 meses. Fenômeno diferente do índice de roubo/furto acima — ocorrências específicas já registradas, não estimativa.`}
          </p>
        )}
      </div>

      <div className="border-t border-[#bdc3c7] mt-3 pt-3">
        <button
          onClick={onToggleOccurrences}
          className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded border ${
            showOccurrences
              ? "bg-[#e74c3c] border-[#e74c3c] text-white"
              : "bg-[#ecf0f1] border-[#bdc3c7] text-[#7f8c8d]"
          }`}
        >
          <span>● Ocorrências reais (CODEC)</span>
          <span>{showOccurrences ? "ligado" : "desligado"}</span>
        </button>
        {showOccurrences && (
          <>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <select
                value={occurrenceFilters.crimeType ?? ""}
                onChange={(e) => onChangeOccurrenceFilters({ crimeType: (e.target.value || undefined) as "roubo" | "furto" | undefined })}
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
              >
                <option value="">Qualquer tipo</option>
                <option value="roubo">Roubo</option>
                <option value="furto">Furto</option>
              </select>

              <select
                value={occurrenceFilters.bairro ?? ""}
                onChange={(e) => onChangeOccurrenceFilters({ bairro: e.target.value || undefined })}
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
              >
                <option value="">Qualquer bairro</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>
                    {titleCase(b)}
                  </option>
                ))}
              </select>

              <select
                value={occurrenceFilters.dayOfWeek ?? ""}
                onChange={(e) =>
                  onChangeOccurrenceFilters({ dayOfWeek: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
              >
                <option value="">Qualquer dia</option>
                {DAY_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={occurrenceFilters.turno ?? ""}
                onChange={(e) => onChangeOccurrenceFilters({ turno: (e.target.value || undefined) as Turno | undefined })}
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
              >
                <option value="">Qualquer turno</option>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>
                    {TURNO_LABELS[t]}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={occurrenceFilters.from ?? ""}
                onChange={(e) => onChangeOccurrenceFilters({ from: e.target.value || undefined })}
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
                title="De"
              />
              <input
                type="date"
                value={occurrenceFilters.to ?? ""}
                onChange={(e) => onChangeOccurrenceFilters({ to: e.target.value || undefined })}
                className="text-[11px] bg-white border border-[#bdc3c7] rounded px-1.5 py-1 text-[#2c3e50]"
                title="Até"
              />
            </div>

            <p className="text-[11px] text-[#7f8c8d] mt-2 leading-snug">
              {occurrenceCount === null
                ? "Carregando…"
                : occurrenceCount === 0
                  ? "Nenhuma ocorrência bate com esse filtro."
                  : `${occurrenceCount} ocorrência(s) real(is) de roubo/furto (agrupadas em clusters — dá zoom pra desagrupar).`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
