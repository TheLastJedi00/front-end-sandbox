import { completed, DECK_START } from '../../slides/deck-navigation';
import { SlideDefinition } from '../../slides/slide-definitions';
import { IDLE_TIMER, startTimer } from './phase-timer';
import { initialPresentation, PresentationState } from './presentation-state';
import { AulaDecks, previousStep } from './previous-step';

const NOW = 1_700_000_000_000;

function slide(id: string, points = 0): SlideDefinition {
  return {
    id,
    title: id,
    points: Array.from({ length: points }, (_, i) => ({ label: `p${i}`, text: `p${i}` })),
  };
}

const OPENING = [slide('a1'), slide('a2', 2)];
const CONCEPT = [slide('c1', 1), slide('c2', 3)];
const DECKS: AulaDecks = { opening: OPENING, conceptOf: () => CONCEPT };

function at(patch: Partial<PresentationState>): PresentationState {
  return { ...initialPresentation(NOW), ...patch };
}

describe('previousStep', () => {
  it('nao volta do comeco da abertura', () => {
    expect(previousStep(at({ stage: 'abertura', deck: DECK_START }), DECKS)).toBeNull();
  });

  it('dentro da abertura, volta uma etapa do deck', () => {
    expect(previousStep(at({ stage: 'abertura', deck: { slide: 1, step: 1 } }), DECKS)).toEqual({
      stage: 'abertura',
      deck: { slide: 1, step: 0 },
    });
  });

  it('dentro do conceito, volta uma etapa do deck', () => {
    const state = at({ stage: 'fase', levelId: 2, conceptOpen: true, deck: { slide: 1, step: 0 } });
    expect(previousStep(state, DECKS)).toEqual({ deck: completed(CONCEPT, 0) });
  });

  it('do codigo, reabre o conceito da mesma fase no ultimo slide, com o timer parado', () => {
    const state = at({ stage: 'fase', levelId: 2, conceptOpen: false, timer: startTimer(NOW) });
    expect(previousStep(state, DECKS)).toEqual({
      stage: 'fase',
      levelId: 2,
      conceptOpen: true,
      deck: { slide: 1, step: 3 },
      timer: IDLE_TIMER,
    });
  });

  it('do comeco do conceito da fase 2, volta para o codigo da fase 1', () => {
    const state = at({ stage: 'fase', levelId: 2, conceptOpen: true, deck: DECK_START });
    expect(previousStep(state, DECKS)).toEqual({
      stage: 'fase',
      levelId: 1,
      conceptOpen: false,
      deck: DECK_START,
      timer: IDLE_TIMER,
    });
  });

  it('do comeco do conceito da fase 1, volta para o ultimo slide da abertura', () => {
    const state = at({ stage: 'fase', levelId: 1, conceptOpen: true, deck: DECK_START });
    expect(previousStep(state, DECKS)).toEqual({
      stage: 'abertura',
      deck: { slide: 1, step: 2 },
      conceptOpen: true,
      timer: IDLE_TIMER,
    });
  });

  it('da tela final, volta para o codigo da fase 3', () => {
    expect(previousStep(at({ stage: 'fim' }), DECKS)).toEqual({
      stage: 'fase',
      levelId: 3,
      conceptOpen: false,
      deck: DECK_START,
      timer: IDLE_TIMER,
    });
  });

  it('usa os decks de verdade por padrao', () => {
    const state = at({ stage: 'fase', levelId: 1, conceptOpen: false });
    const step = previousStep(state);
    expect(step?.conceptOpen).toBeTrue();
    expect(step?.deck?.slide).toBe(2);
  });
});
