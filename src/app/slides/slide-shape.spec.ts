import { SlideDefinition } from './slide-definitions';
import { shapeIssues } from './slide-shape';

const ok: SlideDefinition = {
  id: 'ok',
  title: 'HTML cria as coisas.',
  lead: 'Cada coisa na tela é um elemento.',
  points: [{ label: 'HTML', text: 'estrutura' }],
};

describe('shapeIssues', () => {
  it('deck de 3 slides dentro dos limites nao tem problema', () => {
    expect(shapeIssues('html', [ok, { ...ok, id: 'b' }, { ...ok, id: 'c' }])).toEqual([]);
  });

  it('cobra exatamente 3 slides', () => {
    expect(shapeIssues('css', [ok])).toEqual(['css: 1 slides, devem ser 3']);
  });

  it('aponta etapas, titulo, texto, pontos, notas e linhas acima do limite', () => {
    const heavy: SlideDefinition = {
      id: 'pesado',
      title: 'Um titulo com palavras demais para projetar',
      lead: 'Avance para ver cada parte.',
      points: Array.from({ length: 4 }, (_, i) => ({ label: `p${i}`, text: 'x'.repeat(61) })),
      code: { lines: ['1', '2', '3', '4', '5', '6'] },
    };
    const issues = shapeIssues('js', [heavy, { ...ok, id: 'b' }, { ...ok, id: 'c' }]);

    expect(issues).toContain('pesado: 4 etapas, máximo 3');
    expect(issues).toContain('pesado: título com 7 palavras, máximo 6');
    expect(issues).toContain('pesado: texto de apoio manda avançar');
    expect(issues).toContain('pesado: ponto "p0" com 61 caracteres, máximo 60');
    expect(issues).toContain('pesado: 6 linhas de código, máximo 5');
  });

  it('nota longa de anatomia e texto de apoio longo', () => {
    const slide: SlideDefinition = {
      id: 'anat',
      title: 'Uma tag.',
      lead: 'x'.repeat(81),
      anatomy: {
        language: 'html',
        lines: ['<ball></ball>'],
        parts: [{ line: 0, text: '<ball>', label: 'abertura', note: 'y'.repeat(61) }],
      },
    };
    const issues = shapeIssues('html', [slide, { ...ok, id: 'b' }, { ...ok, id: 'c' }]);

    expect(issues).toContain('anat: texto de apoio com 81 caracteres, máximo 80');
    expect(issues).toContain('anat: nota de "abertura" com 61 caracteres, máximo 60');
  });
});
