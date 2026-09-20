import { GameState, INITIAL_GAME_STATE } from '../../core/models';
import { findLevel } from '../../levels/level-definitions';
import { parseCss } from '../parsers/css-parser';
import { parseHtml } from '../parsers/html-parser';
import { parseJs } from '../parsers/js-parser';
import { buildScene } from '../runtime/scene';
import { validateLevel } from './level-validator';

function validate(levelId: number, code: { html: string; css: string; js: string }, state: GameState) {
  const level = findLevel(levelId)!;
  return validateLevel({
    level,
    scene: buildScene(parseHtml(code.html), parseCss(code.css)),
    js: parseJs(code.js),
    state,
  });
}

describe('validateLevel', () => {
  it('conclui a fase 1 com a solucao de referencia', () => {
    const level = findLevel(1)!;
    const result = validate(1, level.solution, INITIAL_GAME_STATE);

    expect(result.completed).toBeTrue();
  });

  it('aceita formatacao diferente da solucao', () => {
    const result = validate(
      1,
      {
        html: '<sky><ground></ground><ball></ball></sky>',
        css: 'ground{color:green}ball{color:red}sky{color:blue}',
        js: '',
      },
      INITIAL_GAME_STATE,
    );

    expect(result.completed).toBeTrue();
  });

  it('nao conclui a fase 1 com a cor errada', () => {
    const result = validate(
      1,
      {
        html: '<sky><ball></ball><ground></ground></sky>',
        css: 'sky { color: blue } ball { color: pink } ground { color: green }',
        js: '',
      },
      INITIAL_GAME_STATE,
    );

    expect(result.completed).toBeFalse();
    expect(result.checks.find((check) => check.id === 'ball-red')!.done).toBeFalse();
  });

  it('nao conclui a fase 1 com a bola fora do ceu', () => {
    const result = validate(
      1,
      {
        html: '<ball></ball><sky><ground></ground></sky>',
        css: 'sky { color: blue } ball { color: red } ground { color: green }',
        js: '',
      },
      INITIAL_GAME_STATE,
    );

    expect(result.checks.find((check) => check.id === 'ball-inside-sky')!.done).toBeFalse();
  });

  it('so conclui a fase 2 depois de a bola pular de fato', () => {
    const level = findLevel(2)!;
    const parada = validate(2, level.solution, INITIAL_GAME_STATE);
    const pulando = validate(2, level.solution, { ...INITIAL_GAME_STATE, hasJumped: true });

    expect(parada.completed).toBeFalse();
    expect(pulando.completed).toBeTrue();
  });

  it('nao conclui a fase 2 quando a animacao nao foi aplicada na bola', () => {
    const result = validate(
      2,
      {
        html: '<sky><ball></ball><ground></ground></sky>',
        css: '@animation jump { inicio { position: 0 } meio { position: 1 } fim { position: 0 } }',
        js: '',
      },
      { ...INITIAL_GAME_STATE, hasJumped: true },
    );

    expect(result.checks.find((check) => check.id === 'animation-applied')!.done).toBeFalse();
  });

  it('conclui a fase 3 com os tres comandos e o alvo alcancado', () => {
    const level = findLevel(3)!;
    const result = validate(3, level.solution, {
      ...INITIAL_GAME_STATE,
      hasJumped: true,
      reachedGoal: true,
    });

    expect(result.completed).toBeTrue();
  });

  it('nao conclui a fase 3 enquanto a bandeira nao for alcancada', () => {
    const level = findLevel(3)!;
    const result = validate(3, level.solution, INITIAL_GAME_STATE);

    expect(result.completed).toBeFalse();
    expect(result.checks.find((check) => check.id === 'move-forward')!.done).toBeTrue();
  });

  it('exige que o pulo use a animacao que existe no CSS', () => {
    const level = findLevel(3)!;
    const result = validate(
      3,
      { ...level.solution, js: 'if(key("space")){ element("ball").animation("voar") }' },
      INITIAL_GAME_STATE,
    );

    expect(result.checks.find((check) => check.id === 'jump-on-space')!.done).toBeFalse();
  });
});
