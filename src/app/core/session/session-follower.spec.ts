import { initialPresentation } from './presentation-state';
import { followTarget, resumeTarget } from './session-follower';

const base = initialPresentation(0);

describe('followTarget', () => {
  it('ja esta onde a turma esta: nao navega', () => {
    expect(followTarget('/', base)).toBeNull();
    expect(followTarget('/sandbox/2', { ...base, stage: 'fase', levelId: 2 })).toBeNull();
    expect(followTarget('/fim', { ...base, stage: 'fim' })).toBeNull();
  });

  it('leva para a etapa ou fase da turma', () => {
    expect(followTarget('/', { ...base, stage: 'fase', levelId: 1 })).toBe('/sandbox/1');
    expect(followTarget('/sandbox/1', { ...base, stage: 'fase', levelId: 3 })).toBe('/sandbox/3');
    expect(followTarget('/sandbox/3', { ...base, stage: 'fim' })).toBe('/fim');
    expect(followTarget('/fim', base)).toBe('/');
  });

  it('ignora query e fragmento da url', () => {
    expect(followTarget('/fim?x=1#y', { ...base, stage: 'fim' })).toBeNull();
  });

  it('nas telas de entrada ninguem e puxado', () => {
    expect(followTarget('/login', { ...base, stage: 'fim' })).toBeNull();
    expect(followTarget('/papel', { ...base, stage: 'fim' })).toBeNull();
  });
});

describe('resumeTarget', () => {
  it('apresentador na abertura volta para onde a aula esta', () => {
    expect(resumeTarget('/', { ...base, stage: 'fase', levelId: 2 })).toBe('/sandbox/2');
    expect(resumeTarget('/', { ...base, stage: 'fim' })).toBe('/fim');
  });

  it('a aula ainda na abertura: fica', () => {
    expect(resumeTarget('/', base)).toBeNull();
  });

  it('fora da abertura, a rota e escolha do apresentador', () => {
    expect(resumeTarget('/sandbox/1', { ...base, stage: 'fase', levelId: 3 })).toBeNull();
    expect(resumeTarget('/fim', base)).toBeNull();
  });
});
