import { FIRST_LEVEL, findLevel, LAST_LEVEL, LEVELS } from '../../levels/level-definitions';
import { completed, DECK_START, DeckPosition, retreat } from '../../slides/deck-navigation';
import { conceptSlides, OPENING_DECK, SlideDefinition } from '../../slides/slide-definitions';
import { IDLE_TIMER } from './phase-timer';
import { PresentationState } from './presentation-state';

/** Os decks da aula: a abertura e o conceito de cada fase. */
export interface AulaDecks {
  readonly opening: readonly SlideDefinition[];
  readonly conceptOf: (levelId: number) => readonly SlideDefinition[];
}

export const AULA_DECKS: AulaDecks = {
  opening: OPENING_DECK,
  conceptOf: (levelId) => conceptSlides((findLevel(levelId) ?? LEVELS[0]).concept),
};

/** O codigo de uma fase, com o conceito fechado. O timer volta parado. */
function codeOf(levelId: number): Partial<PresentationState> {
  return { stage: 'fase', levelId, conceptOpen: false, deck: DECK_START, timer: IDLE_TIMER };
}

/** O conceito de uma fase, aberto ja no ultimo slide completo. */
function conceptEndOf(levelId: number, decks: AulaDecks): Partial<PresentationState> {
  const slides = decks.conceptOf(levelId);
  return {
    stage: 'fase',
    levelId,
    conceptOpen: true,
    deck: completed(slides, slides.length - 1),
    timer: IDLE_TIMER,
  };
}

/**
 * A aula e uma sequencia so — abertura, e para cada fase o conceito e o codigo,
 * e por fim a tela final. Voltar leva ao passo anterior dela, inclusive para
 * fora do codigo. `null` quando nao ha para onde voltar (o comeco da abertura).
 * Funcao pura: quem grava e a `LiveSession`.
 */
export function previousStep(
  state: PresentationState,
  decks: AulaDecks = AULA_DECKS,
): Partial<PresentationState> | null {
  switch (state.stage) {
    case 'abertura': {
      const deck = retreat(decks.opening, state.deck);
      return sameDeck(deck, state.deck) ? null : { stage: 'abertura', deck };
    }

    case 'fim':
      return codeOf(LAST_LEVEL);

    case 'fase': {
      if (!state.conceptOpen) return conceptEndOf(state.levelId, decks);

      const deck = retreat(decks.conceptOf(state.levelId), state.deck);
      if (!sameDeck(deck, state.deck)) return { deck };

      if (state.levelId > FIRST_LEVEL) return codeOf(state.levelId - 1);
      return {
        stage: 'abertura',
        deck: completed(decks.opening, decks.opening.length - 1),
        conceptOpen: true,
        timer: IDLE_TIMER,
      };
    }
  }
}

function sameDeck(a: DeckPosition, b: DeckPosition): boolean {
  return a.slide === b.slide && a.step === b.step;
}
