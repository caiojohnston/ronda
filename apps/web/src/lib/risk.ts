export const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const TURNO_LABELS: Record<string, string> = {
  madrugada: "Madrugada · 0h–6h",
  manha: "Manhã · 6h–12h",
  tarde: "Tarde · 12h–18h",
  noite: "Noite · 18h–24h",
};

export function riskColor(intensity: number): string {
  if (intensity < 0.25) return "#2ecc71";
  if (intensity < 0.5) return "#f1c40f";
  if (intensity < 0.75) return "#e67e22";
  return "#e74c3c";
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
