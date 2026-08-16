export const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const TURNO_LABELS: Record<string, string> = {
  madrugada: "Madrugada · 0h–6h",
  manha: "Manhã · 6h–12h",
  tarde: "Tarde · 12h–18h",
  noite: "Noite · 18h–24h",
};

export const RISK_LEVELS: { max: number; color: string; label: string }[] = [
  { max: 0.25, color: "#2ecc71", label: "Baixo" },
  { max: 0.5, color: "#f1c40f", label: "Moderado" },
  { max: 0.75, color: "#e67e22", label: "Alto" },
  { max: Infinity, color: "#e74c3c", label: "Crítico" },
];

export function riskColor(intensity: number): string {
  return (RISK_LEVELS.find((l) => intensity < l.max) ?? RISK_LEVELS[RISK_LEVELS.length - 1]).color;
}

export function riskLabel(intensity: number): string {
  return (RISK_LEVELS.find((l) => intensity < l.max) ?? RISK_LEVELS[RISK_LEVELS.length - 1]).label;
}

export function markerSize(intensity: number): number {
  return 14 + intensity * 28;
}
