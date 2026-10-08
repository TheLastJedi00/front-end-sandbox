import {
  formatRemaining,
  IDLE_TIMER,
  isExpired,
  pauseTimer,
  PHASE_DURATION_MS,
  remainingMs,
  resetTimer,
  resumeTimer,
  startTimer,
} from './phase-timer';

const T0 = 1_700_000_000_000;

describe('phase-timer', () => {
  it('parado mostra os 3 minutos e nao expira', () => {
    expect(remainingMs(IDLE_TIMER, T0)).toBe(PHASE_DURATION_MS);
    expect(isExpired(IDLE_TIMER, T0 + 10 * PHASE_DURATION_MS)).toBeFalse();
  });

  it('rodando conta a partir de endsAt', () => {
    const timer = startTimer(T0);
    expect(remainingMs(timer, T0)).toBe(PHASE_DURATION_MS);
    expect(remainingMs(timer, T0 + 60_000)).toBe(120_000);
  });

  it('chega a zero e nao fica negativo', () => {
    const timer = startTimer(T0);
    expect(remainingMs(timer, T0 + PHASE_DURATION_MS + 5000)).toBe(0);
    expect(isExpired(timer, T0 + PHASE_DURATION_MS)).toBeTrue();
    expect(isExpired(timer, T0 + PHASE_DURATION_MS - 1)).toBeFalse();
  });

  it('pausar congela o que falta, e o tempo pausado nao conta', () => {
    const paused = pauseTimer(startTimer(T0), T0 + 30_000);
    expect(paused).toEqual({ status: 'pausado', endsAt: null, remainingMs: 150_000 });
    expect(remainingMs(paused, T0 + 999_999)).toBe(150_000);

    const resumed = resumeTimer(paused, T0 + 100_000);
    expect(resumed.status).toBe('rodando');
    expect(remainingMs(resumed, T0 + 100_000)).toBe(150_000);
    expect(remainingMs(resumed, T0 + 110_000)).toBe(140_000);
  });

  it('pausar o que nao roda e retomar o que nao pausou nao mudam nada', () => {
    expect(pauseTimer(IDLE_TIMER, T0)).toBe(IDLE_TIMER);
    const running = startTimer(T0);
    expect(resumeTimer(running, T0 + 1)).toBe(running);
  });

  it('expirado tambem quando pausado no zero', () => {
    const paused = pauseTimer(startTimer(T0), T0 + PHASE_DURATION_MS + 1);
    expect(isExpired(paused, T0)).toBeTrue();
  });

  it('reiniciar volta aos 3 minutos, ja contando', () => {
    const timer = resetTimer(T0 + 5000);
    expect(timer.status).toBe('rodando');
    expect(remainingMs(timer, T0 + 5000)).toBe(PHASE_DURATION_MS);
  });

  it('formata mm:ss arredondando para cima', () => {
    expect(formatRemaining(PHASE_DURATION_MS)).toBe('3:00');
    expect(formatRemaining(61_000)).toBe('1:01');
    expect(formatRemaining(59_001)).toBe('1:00');
    expect(formatRemaining(1)).toBe('0:01');
    expect(formatRemaining(0)).toBe('0:00');
  });
});
