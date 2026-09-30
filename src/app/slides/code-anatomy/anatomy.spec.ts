import { SlideAnatomy } from '../slide-definitions';
import { anatomyLines } from './anatomy';

function text(segment: { tokens: readonly { text: string }[] }): string {
  return segment.tokens.map((t) => t.text).join('');
}

describe('anatomyLines', () => {
  const tag: SlideAnatomy = {
    language: 'html',
    lines: ['<ball></ball>'],
    parts: [
      { line: 0, text: '</ball>', label: 'fechamento', note: '' },
      { line: 0, text: '<ball>', label: 'abertura', note: '' },
    ],
  };

  it('separa as partes na ordem do texto, guardando o indice da explicacao', () => {
    const [line] = anatomyLines(tag);

    expect(line.map(text)).toEqual(['<ball>', '</ball>']);
    expect(line.map((s) => s.part)).toEqual([1, 0]);
  });

  it('mantem o realce da IDE dentro de cada parte', () => {
    const [[opening]] = anatomyLines(tag);

    expect(opening.tokens).toEqual([
      { text: '<', kind: 'bracket' },
      { text: 'ball', kind: 'tag' },
      { text: '>', kind: 'bracket' },
    ]);
  });

  it('deixa o codigo sem nome entre as partes', () => {
    const [line] = anatomyLines({
      language: 'css',
      lines: ['ball { color: red; }'],
      parts: [
        { line: 0, text: 'ball', label: 'seletor', note: '' },
        { line: 0, text: 'color', label: 'propriedade', note: '' },
      ],
    });

    expect(line.map(text)).toEqual(['ball', ' { ', 'color', ': red; }']);
    expect(line.map((s) => s.part)).toEqual([0, undefined, 1, undefined]);
  });

  it('acha a ocorrencia pedida de um trecho repetido', () => {
    const [line] = anatomyLines({
      language: 'js',
      lines: ['if(key("D")){ avancar() }'],
      parts: [{ line: 0, text: '(', occurrence: 1, label: 'x', note: '' }],
    });

    expect(line.map(text)).toEqual(['if(key', '(', '"D")){ avancar() }']);
  });

  it('quebra quando o trecho nao existe na linha', () => {
    expect(() =>
      anatomyLines({
        language: 'html',
        lines: ['<sky></sky>'],
        parts: [{ line: 0, text: '<ball>', label: 'x', note: '' }],
      }),
    ).toThrowError(/nao encontrada/);
  });
});
