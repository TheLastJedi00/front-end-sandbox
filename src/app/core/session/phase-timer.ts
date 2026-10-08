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

/** Quanto falta agora, em ms. Nunca negativo. */
export function remainingMs(timer: PhaseTimer, now: number): number {
  if (timer.status === 'rodando' && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now);
  }
  return timer.remainingMs;
}

export function isExpired(timer: PhaseTimer, now: number): boolean {
  return timer.status !== 'parado' && remainingMs(timer, now) === 0;
}

/** Comeca do zero: 3 minutos a partir de agora. */
export function startTimer(now: number): PhaseTimer {
  return { status: 'rodando', endsAt: now + PHASE_DURATION_MS, remainingMs: PHASE_DURATION_MS };
}

/** Congela o que falta. Pausar o que nao esta rodando nao muda nada. */
export function pauseTimer(timer: PhaseTimer, now: number): PhaseTimer {
  if (timer.status !== 'rodando') return timer;
  return { status: 'pausado', endsAt: null, remainingMs: remainingMs(timer, now) };
}

/** Volta a contar de onde parou. */
export function resumeTimer(timer: PhaseTimer, now: number): PhaseTimer {
  if (timer.status !== 'pausado') return timer;
  return { status: 'rodando', endsAt: now + timer.remainingMs, remainingMs: timer.remainingMs };
}

/** Reiniciar e comecar de novo os 3 minutos, ja contando. */
export function resetTimer(now: number): PhaseTimer {
  return startTimer(now);
}

/** `mm:ss`, arredondando para cima: o 0:00 so aparece quando acabou mesmo. */
export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
