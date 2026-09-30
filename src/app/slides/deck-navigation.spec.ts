import { advance, completed, DECK_START, retreat, stepsOf } from './deck-navigation';
import { SlideDefinition } from './slide-definitions';

const plain: SlideDefinition = { id: 'a', title: 'Sem etapas' };
const withPoints: SlideDefinition = {
  id: 'b',
  title: 'Dois pontos',
  points: [
    { label: 'HTML', text: 'estrutura' },
    { label: 'CSS', text: 'aparencia' },
  ],
};
const withAnatomy: SlideDefinition = {
  id: 'c',
  title: 'Anatomia',
  anatomy: {
    language: 'html',
    lines: ['<ball></ball>'],
    parts: [
      { line: 0, text: '<ball>', label: 'abertura', note: '' },
      { line: 0, text: '</ball>', label: 'fechamento', note: '' },
    ],
  },
};
const deck = [plain, withPoints, withAnatomy];

describe('stepsOf', () => {
  it('conta pontos e partes da anatomia', () => {
    expect(stepsOf(plain)).toBe(0);
    expect(stepsOf(withPoints)).toBe(2);
    expect(stepsOf({ ...withPoints, anatomy: withAnatomy.anatomy })).toBe(4);
  });
});

describe('advance', () => {
  it('troca de slide quando nao ha etapas', () => {
    expect(advance(deck, DECK_START)).toEqual({ slide: 1, step: 0 });
  });

  it('revela a proxima etapa antes de trocar de slide', () => {
    expect(advance(deck, { slide: 1, step: 0 })).toEqual({ slide: 1, step: 1 });
    expect(advance(deck, { slide: 1, step: 1 })).toEqual({ slide: 1, step: 2 });
    expect(advance(deck, { slide: 1, step: 2 })).toEqual({ slide: 2, step: 0 });
  });

  it('devolve null depois do ultimo slide completo', () => {
    expect(advance(deck, { slide: 2, step: 1 })).toEqual({ slide: 2, step: 2 });
    expect(advance(deck, { slide: 2, step: 2 })).toBeNull();
  });
});

describe('retreat', () => {
  it('desfaz a ultima etapa', () => {
    expect(retreat(deck, { slide: 1, step: 2 })).toEqual({ slide: 1, step: 1 });
  });

  it('volta ao slide anterior ja completo', () => {
    expect(retreat(deck, { slide: 2, step: 0 })).toEqual({ slide: 1, step: 2 });
  });

  it('nao passa do comeco', () => {
    expect(retreat(deck, DECK_START)).toEqual(DECK_START);
  });
});

describe('completed', () => {
  it('posiciona o slide com todas as etapas reveladas', () => {
    expect(completed(deck, 2)).toEqual({ slide: 2, step: 2 });
  });
});
