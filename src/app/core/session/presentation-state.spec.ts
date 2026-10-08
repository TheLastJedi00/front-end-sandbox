import { IDLE_TIMER, PHASE_DURATION_MS } from './phase-timer';
import { initialPresentation, parsePresentationState, routeOf } from './presentation-state';

const NOW = 1_700_000_000_000;

describe('parsePresentationState', () => {
  it('documento ausente vira o comeco da aula', () => {
    expect(parsePresentationState(undefined, NOW)).toEqual(initialPresentation(NOW));
    expect(parsePresentationState(null, NOW)).toEqual(initialPresentation(NOW));
  });

  it('le um documento completo', () => {
    const state = parsePresentationState(
      {
        stage: 'fase',
        levelId: 2,
        deck: { slide: 3, step: 1 },
        conceptOpen: false,
        timer: { status: 'rodando', endsAt: NOW + 1000, remainingMs: 1000 },
        startedAt: NOW - 5000,
        updatedAt: { seconds: 1 },
      },
      NOW,
    );

    expect(state).toEqual({
      stage: 'fase',
      levelId: 2,
      deck: { slide: 3, step: 1 },
      conceptOpen: false,
      timer: { status: 'rodando', endsAt: NOW + 1000, remainingMs: 1000 },
      startedAt: NOW - 5000,
    });
  });

  it('campos com tipo errado voltam ao valor inicial', () => {
    const state = parsePresentationState(
      { stage: 'qualquer', levelId: 'dois', deck: 'x', conceptOpen: 'sim', timer: 7 },
      NOW,
    );
    expect(state).toEqual(initialPresentation(NOW));
  });

  it('fase fora do intervalo e limitada as fases que existem', () => {
    expect(parsePresentationState({ levelId: 99 }, NOW).levelId).toBe(3);
    expect(parsePresentationState({ levelId: -4 }, NOW).levelId).toBe(1);
  });

  it('posicao do deck nunca e negativa nem fracionada', () => {
    expect(parsePresentationState({ deck: { slide: -1, step: 2.7 } }, NOW).deck).toEqual({
      slide: 0,
      step: 2,
    });
  });

  it('timer rodando sem endsAt fica pausado; status desconhecido fica parado', () => {
    expect(
      parsePresentationState({ timer: { status: 'rodando', remainingMs: 5000 } }, NOW).timer,
    ).toEqual({ status: 'pausado', endsAt: null, remainingMs: 5000 });
    expect(parsePresentationState({ timer: { status: '?' } }, NOW).timer).toEqual(IDLE_TIMER);
    expect(
      parsePresentationState({ timer: { status: 'pausado', remainingMs: 1e9 } }, NOW).timer
        .remainingMs,
    ).toBe(PHASE_DURATION_MS);
  });
});

describe('routeOf', () => {
  it('leva cada etapa da aula a sua rota', () => {
    const base = initialPresentation(NOW);
    expect(routeOf(base)).toEqual(['/']);
    expect(routeOf({ ...base, stage: 'fase', levelId: 2 })).toEqual(['/sandbox', '2']);
    expect(routeOf({ ...base, stage: 'fim' })).toEqual(['/fim']);
  });
});
