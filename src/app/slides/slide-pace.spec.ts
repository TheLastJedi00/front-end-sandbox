import { paceOf, SLIDE_TARGET_MS } from './slide-pace';

describe('paceOf', () => {
  it('a meta e de 20 segundos por slide', () => {
    expect(SLIDE_TARGET_MS).toBe(20_000);
  });

  it('no comeco do slide, no ritmo e vazia', () => {
    expect(paceOf(0)).toEqual({ fraction: 0, status: 'no-ritmo' });
    expect(paceOf(-50)).toEqual({ fraction: 0, status: 'no-ritmo' });
  });

  it('a partir de 75% da meta, perto', () => {
    expect(paceOf(14_999).status).toBe('no-ritmo');
    expect(paceOf(15_000).status).toBe('perto');
    expect(paceOf(20_000)).toEqual({ fraction: 1, status: 'perto' });
  });

  it('depois da meta, passou e a barra fica cheia', () => {
    expect(paceOf(20_001)).toEqual({ fraction: 1, status: 'passou' });
    expect(paceOf(60_000).fraction).toBe(1);
  });
});
