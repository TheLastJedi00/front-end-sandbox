import { ghostSuggestion } from './ghost-suggestion';

describe('ghostSuggestion', () => {
  it('sugere o ceu quando a fase 1 esta vazia', () => {
    const suggestion = ghostSuggestion({ text: '', caret: 0, file: 'html', concept: 'HTML' })!;

    expect(suggestion.insert).toContain('<sky>');
    expect(suggestion.summary).toBe('criar o céu');
  });

  it('pula o passo que o aluno ja escreveu', () => {
    const suggestion = ghostSuggestion({
      text: '<sky>\n\n</sky>',
      caret: 6,
      file: 'html',
      concept: 'HTML',
    })!;

    expect(suggestion.insert).toContain('<ball></ball>');
  });

  it('ignora o que esta em comentario', () => {
    const suggestion = ghostSuggestion({
      text: '<!-- <ball></ball> -->\n<sky>\n\n</sky>',
      caret: 29,
      file: 'html',
      concept: 'HTML',
    })!;

    expect(suggestion.insert).toContain('<ball></ball>');
  });

  it('nao sugere nada quando a fase 1 esta completa', () => {
    const text = '<sky>\n    <ball></ball>\n    <ground></ground>\n</sky>';

    expect(ghostSuggestion({ text, caret: text.length, file: 'html', concept: 'HTML' })).toBeNull();
  });

  it('sugere blocos inteiros, nao apenas a linha', () => {
    const suggestion = ghostSuggestion({ text: '', caret: 0, file: 'css', concept: 'CSS' })!;

    expect(suggestion.insert).toBe('sky {\n    color: blue;\n}');
  });

  it('chega na animacao depois das cores da fase 2', () => {
    const text = 'sky { color: blue }\nball { color: red }\nground { color: green }\n';
    const suggestion = ghostSuggestion({ text, caret: text.length, file: 'css', concept: 'CSS' })!;

    expect(suggestion.insert).toContain('@animation jump');
    expect(suggestion.summary).toBe('declarar a animação do pulo');
  });

  it('sugere aplicar a animacao depois de ela existir', () => {
    const text =
      'sky { color: blue }\nball { color: red }\nground { color: green }\n@animation jump { inicio { position: 0 } }\n';
    const suggestion = ghostSuggestion({ text, caret: text.length, file: 'css', concept: 'CSS' })!;

    expect(suggestion.insert).toContain('animation: jump');
  });

  it('segue a ordem D, A e espaco na fase 3', () => {
    const primeira = ghostSuggestion({ text: '', caret: 0, file: 'js', concept: 'JavaScript' })!;
    const depoisDoD = ghostSuggestion({
      text: 'if(key("D")){ avancar() }',
      caret: 25,
      file: 'js',
      concept: 'JavaScript',
    })!;

    expect(primeira.insert).toContain('key("D")');
    expect(depoisDoD.insert).toContain('key("A")');
  });

  it('quebra a linha quando o cursor esta no meio de uma linha escrita', () => {
    const suggestion = ghostSuggestion({
      text: 'ball { color: red }',
      caret: 19,
      file: 'css',
      concept: 'CSS',
    })!;

    expect(suggestion.insert.startsWith('\n')).toBeTrue();
  });

  it('nao sugere nada num arquivo que nao e o da fase', () => {
    expect(ghostSuggestion({ text: '', caret: 0, file: 'html', concept: 'CSS' })).toBeNull();
    expect(ghostSuggestion({ text: '', caret: 0, file: 'css', concept: 'JavaScript' })).toBeNull();
  });
});
