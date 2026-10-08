/**
 * Meta de tempo de cada slide. Com 3 slides por etapa, cada etapa da aula leva
 * um minuto de slides — e a apresentacao inteira cabe em 15 minutos com folga.
 */
export const SLIDE_TARGET_MS = 20_000;

/** A partir daqui da meta, a barra avisa que o slide esta acabando. */
const NEAR_FRACTION = 0.75;

export type PaceStatus = 'no-ritmo' | 'perto' | 'passou';

export interface Pace {
  /** Quanto da meta ja foi usado, de 0 a 1 (fica em 1 depois de passar). */
  readonly fraction: number;
  readonly status: PaceStatus;
}

/** O ritmo de um slide aberto ha `elapsedMs`. Funcao pura. */
export function paceOf(elapsedMs: number, targetMs = SLIDE_TARGET_MS): Pace {
  const used = Math.max(0, elapsedMs) / targetMs;
  return {
    fraction: Math.min(used, 1),
    status: used > 1 ? 'passou' : used >= NEAR_FRACTION ? 'perto' : 'no-ritmo',
  };
}
