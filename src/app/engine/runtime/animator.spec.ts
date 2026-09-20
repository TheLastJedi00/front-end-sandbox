import { CssAnimation, Keyframe } from '../parsers/css-parser';
import { jumpHeight, sampleKeyframes } from './animator';
import { MAX_JUMP_HEIGHT } from './renderer';

const jump: readonly Keyframe[] = [
  { step: 'inicio', position: 0, line: 1 },
  { step: 'meio', position: 1, line: 2 },
  { step: 'fim', position: 0, line: 3 },
];

describe('sampleKeyframes', () => {
  it('sai do chao, sobe ate o topo e volta', () => {
    expect(sampleKeyframes(jump, 0)).toBe(0);
    expect(sampleKeyframes(jump, 0.5)).toBe(1);
    expect(sampleKeyframes(jump, 1)).toBe(0);
  });

  it('interpola entre dois momentos', () => {
    expect(sampleKeyframes(jump, 0.25)).toBeCloseTo(0.5);
    expect(sampleKeyframes(jump, 0.75)).toBeCloseTo(0.5);
  });

  it('nao depende da ordem em que os momentos foram escritos', () => {
    const invertido = [jump[2], jump[0], jump[1]];

    expect(sampleKeyframes(invertido, 0.5)).toBe(1);
  });

  it('mantem o valor quando falta um momento', () => {
    const semMeio = [jump[0], jump[2]];

    expect(sampleKeyframes(semMeio, 0.5)).toBe(0);
  });

  it('devolve zero quando nao ha nenhum momento', () => {
    expect(sampleKeyframes([], 0.5)).toBe(0);
  });

  it('nao extrapola fora do intervalo', () => {
    expect(sampleKeyframes(jump, -1)).toBe(0);
    expect(sampleKeyframes(jump, 2)).toBe(0);
  });
});

describe('jumpHeight', () => {
  const animation: CssAnimation = { name: 'jump', line: 1, keyframes: jump };

  it('converte o topo da animacao na altura maxima do palco', () => {
    expect(jumpHeight(animation, 0.5)).toBe(MAX_JUMP_HEIGHT);
  });

  it('mantem a bola no chao quando nao ha animacao rodando', () => {
    expect(jumpHeight(animation, null)).toBe(0);
    expect(jumpHeight(null, 0.5)).toBe(0);
  });

  it('limita posicoes maiores que 1 a altura maxima', () => {
    const exagerada: CssAnimation = {
      name: 'jump',
      line: 1,
      keyframes: [{ step: 'meio', position: 9, line: 1 }],
    };

    expect(jumpHeight(exagerada, 0.5)).toBe(MAX_JUMP_HEIGHT);
  });
});
