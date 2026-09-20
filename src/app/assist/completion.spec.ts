import { applyCompletion, autoClose, completionsAt, wordBefore } from './completion';
import { vocabularyFor } from './vocabulary';

describe('wordBefore', () => {
  it('pega a palavra que esta sendo digitada', () => {
    expect(wordBefore('ball { col', 10)).toEqual({ word: 'col', start: 7 });
  });

  it('devolve vazio quando o cursor nao esta numa palavra', () => {
    expect(wordBefore('ball { ', 7).word).toBe('');
  });
});

describe('completionsAt', () => {
  it('nao sugere nada sem uma palavra comecada', () => {
    expect(completionsAt({ text: '<sky>\n', caret: 6, file: 'html' })).toEqual([]);
  });

  it('sugere as tags do jogo pelo prefixo', () => {
    const suggestions = completionsAt({ text: '<b', caret: 2, file: 'html' });

    expect(suggestions.map((s) => s.label)).toEqual(['ball']);
  });

  it('fecha a tag quando a sugestao vem depois de <', () => {
    const [suggestion] = completionsAt({ text: '<sky><ba', caret: 8, file: 'html' });
    const edit = applyCompletion('<sky><ba', suggestion);

    expect(edit.text).toBe('<sky><ball></ball>');
    // O cursor para entre a abertura e o fechamento.
    expect(edit.text.slice(0, edit.caret)).toBe('<sky><ball>');
  });

  it('nao fecha a tag quando a palavra nao vem de um <', () => {
    const [suggestion] = completionsAt({ text: 'ba', caret: 2, file: 'html' });

    expect(suggestion.insert).toBe('ball');
  });

  it('nao repete o que ja foi digitado por inteiro', () => {
    expect(completionsAt({ text: 'ball', caret: 4, file: 'html' })).toEqual([]);
  });

  it('sugere propriedades do CSS com os dois-pontos prontos', () => {
    const [suggestion] = completionsAt({ text: 'ball { col', caret: 10, file: 'css' });

    expect(suggestion.label).toBe('color');
    expect(applyCompletion('ball { col', suggestion).text).toBe('ball { color: ');
  });

  it('sugere o bloco inteiro da animacao', () => {
    const [suggestion] = completionsAt({ text: '@anim', caret: 5, file: 'css' });

    expect(suggestion.label).toBe('@animation');
    expect(suggestion.insert).toContain('inicio { position: 0 }');
  });

  it('restringe as sugestoes ao vocabulario do arquivo', () => {
    const labels = completionsAt({ text: 'a', caret: 1, file: 'js' }).map((s) => s.label);

    expect(labels).toContain('avancar');
    expect(labels).not.toContain('animation');
  });

  it('nao sugere nada fora do vocabulario da fase', () => {
    expect(completionsAt({ text: 'div', caret: 3, file: 'html' })).toEqual([]);
  });
});

describe('autoClose', () => {
  it('fecha a tag recem aberta e mantem o cursor dentro dela', () => {
    const edit = autoClose({ text: '<ball>', caret: 6, file: 'html' })!;

    expect(edit.text).toBe('<ball></ball>');
    expect(edit.caret).toBe(6);
  });

  it('nao fecha duas vezes a mesma tag', () => {
    expect(autoClose({ text: '<ball></ball>', caret: 6, file: 'html' })).toBeNull();
  });

  it('nao fecha o proprio fechamento', () => {
    expect(autoClose({ text: '<ball></ball>', caret: 13, file: 'html' })).toBeNull();
  });

  it('fecha a chave no CSS', () => {
    const edit = autoClose({ text: 'ball {', caret: 6, file: 'css' })!;

    expect(edit.text).toBe('ball {}');
    expect(edit.caret).toBe(6);
  });

  it('nao fecha a chave quando ja existe uma na frente', () => {
    expect(autoClose({ text: 'ball {}', caret: 6, file: 'css' })).toBeNull();
  });

  it('ignora caracteres que nao pedem fechamento', () => {
    expect(autoClose({ text: 'ball', caret: 4, file: 'html' })).toBeNull();
  });
});

describe('vocabularyFor', () => {
  it('da ao HTML apenas as tres tags do jogo', () => {
    expect(vocabularyFor('html').map((entry) => entry.label)).toEqual(['sky', 'ball', 'ground']);
  });

  it('nao deixa entrada sem explicacao, porque ela aparece na lista', () => {
    for (const file of ['html', 'css', 'js'] as const) {
      for (const entry of vocabularyFor(file)) {
        expect(entry.detail.length).toBeGreaterThan(0);
      }
    }
  });
});
