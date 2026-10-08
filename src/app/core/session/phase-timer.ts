/** Tempo de cada fase de programacao. Fixo: nao e configuravel na tela. */
export const PHASE_DURATION_MS = 3 * 60 * 1000;

/**
 * Timer da fase como ele vive no documento da sessao. Nao ha tique gravado: com
 * o instante em que termina (`endsAt`), cada maquina conta sozinha.
 */
export interface PhaseTimer {
  readonly status: 'parado' | 'rodando' | 'pausado';
  /** Epoch ms em que o tempo acaba. So vale enquanto `rodando`. */
  readonly endsAt: number | null;
  /** Quanto falta quando `parado` ou `pausado`. */
  readonly remainingMs: number;
}

export const IDLE_TIMER: PhaseTimer = {
  status: 'parado',
  endsAt: null,
  remainingMs: PHASE_DURATION_MS,
};
