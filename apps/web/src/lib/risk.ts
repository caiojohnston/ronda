export const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const TURNO_LABELS: Record<string, string> = {
  madrugada: "Madrugada · 0h–6h",
  manha: "Manhã · 6h–12h",
  tarde: "Tarde · 12h–18h",
  noite: "Noite · 18h–24h",
};

export function riskColor(intensity: number): string {
  if (intensity < 0.25) return "#22c55e";
  if (intensity < 0.5) return "#eab308";
  if (intensity < 0.75) return "#f97316";
  return "#ef4444";
}

export function riskLabel(intensity: number): string {
  if (intensity < 0.25) return "Baixo";
  if (intensity < 0.5) return "Moderado";
  if (intensity < 0.75) return "Alto";
  return "Crítico";
}

export function markerSize(intensity: number): number {
  return 14 + intensity * 28;
}

export function pulseDuration(intensity: number): number {
  return 2.6 - intensity * 1.6;
}
