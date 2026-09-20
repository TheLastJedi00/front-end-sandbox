import { parseCss } from '../parsers/css-parser';
import { parseHtml } from '../parsers/html-parser';
import { buildScene } from './scene';

function scene(html: string, css: string) {
  return buildScene(parseHtml(html), parseCss(css));
}

describe('buildScene', () => {
  it('junta estrutura e cor no resultado esperado da fase 1', () => {
    const result = scene(
      '<sky><ball></ball><ground></ground></sky>',
      'sky { color: blue } ball { color: red } ground { color: green }',
    );

    expect(result.sky.visible).toBeTrue();
    expect(result.ball.visible).toBeTrue();
    expect(result.ground.visible).toBeTrue();
    expect(result.ball.colorName).toBe('red');
    expect(result.sky.color).toBe('var(--game-blue)');
  });

  it('nao mostra a bola quando ela esta fora do ceu', () => {
    const result = scene('<ball></ball><sky></sky>', 'ball { color: red }');

    expect(result.ball.present).toBeTrue();
    expect(result.ball.visible).toBeFalse();
  });

  it('usa cinza quando nenhuma cor foi declarada', () => {
    const result = scene('<sky><ball></ball></sky>', '');

    expect(result.ball.colorName).toBeNull();
    expect(result.ball.color).toBe('var(--border-strong)');
  });

  it('mantem cor desconhecida como o aluno escreveu', () => {
    const result = scene('<sky><ball></ball></sky>', 'ball { color: #ff0000 }');

    expect(result.ball.color).toBe('#ff0000');
  });

  it('liga a animacao declarada ao elemento que a usa', () => {
    const result = scene(
      '<sky><ball></ball></sky>',
      'ball { animation: jump } @animation jump { inicio { position: 0 } meio { position: 1 } fim { position: 0 } }',
    );

    expect(result.ballAnimation).toBe('jump');
    expect(result.animation?.keyframes.length).toBe(3);
  });

  it('nao encontra a animacao quando ela nao foi declarada', () => {
    const result = scene('<sky><ball></ball></sky>', 'ball { animation: jump }');

    expect(result.ballAnimation).toBe('jump');
    expect(result.animation).toBeNull();
  });
});
