/**
 * Libro de Reclamaciones — reglas del D.S. 011-2011-PCM (Reglamento del Libro
 * de Reclamaciones) y del art. 24 del Código de Protección y Defensa del
 * Consumidor, modificado por el D.L. 1308.
 */

/** Tipos de documento admitidos en la hoja de reclamación. */
export const DOCUMENT_TYPES = ["DNI", "Carné de extranjería", "Pasaporte", "RUC"] as const;

/** Plazo legal de respuesta: quince (15) días hábiles desde la presentación. */
export const RESPONSE_BUSINESS_DAYS = 15;

/**
 * Código visible de la hoja. El correlativo viene de un serial de Postgres y
 * nunca se reinicia; el año es solo para que el consumidor lo ubique.
 */
export function complaintCode(number: number, createdAt: Date): string {
  return `LR-${createdAt.getFullYear()}-${String(number).padStart(6, "0")}`;
}

/**
 * Suma días hábiles saltando sábados y domingos. No descuenta feriados: el
 * resultado es una fecha igual o anterior a la legal, así que el compromiso
 * que se le comunica al consumidor nunca queda por detrás del plazo real.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return result;
}

export function formatLimaDate(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeZone: "America/Lima",
  }).format(date);
}

export function formatLimaDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(date);
}

/**
 * Días calendario que faltan para una fecha, redondeando al día de Lima. Se usa
 * en el panel para avisar cuánto queda del plazo legal de respuesta.
 */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const dayInMs = 24 * 60 * 60 * 1000;
  const startOfDay = (value: Date) => {
    const iso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
    return Date.parse(`${iso}T00:00:00Z`);
  };
  return Math.round((startOfDay(date) - startOfDay(from)) / dayInMs);
}
