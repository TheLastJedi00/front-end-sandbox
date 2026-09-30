import { highlightLines } from './highlight';

describe('highlightLines', () => {
  it('devolve uma lista de tokens por linha', () => {
    const lines = highlightLines('<sky>\n    <ball></ball>\n</sky>', 'html');

    expect(lines.length).toBe(3);
    expect(lines[0].map((t) => t.text).join('')).toBe('<sky>');
    expect(lines[1].map((t) => t.text).join('')).toBe('    <ball></ball>');
  });

  it('mantem o tipo do token de cada lado da quebra', () => {
    const [first, second] = highlightLines('ball {\n    color: red;\n}', 'css');

    expect(first[0]).toEqual({ text: 'ball', kind: 'selector' });
    expect(second.find((t) => t.text === 'color')?.kind).toBe('property');
    expect(second.find((t) => t.text === 'red')?.kind).toBe('value');
  });

  it('preserva linhas em branco', () => {
    expect(highlightLines('if(key("D")){\n\n}', 'js')[1]).toEqual([]);
  });
});
