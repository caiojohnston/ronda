export const TURNOS = ["madrugada", "manha", "tarde", "noite"] as const;
export type Turno = (typeof TURNOS)[number];

export function turnoFromHour(hour: number): Turno {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export function currentDayAndTurno(now = new Date()) {
  return { day: now.getDay(), turno: turnoFromHour(now.getHours()) };
}

export function isValidDay(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

export function isValidTurno(turno: string): turno is Turno {
  return (TURNOS as readonly string[]).includes(turno);
}
