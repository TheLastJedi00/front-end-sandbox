import { anatomyLines } from './code-anatomy/anatomy';
import { parseCss } from '../engine/parsers/css-parser';
import { parseHtml } from '../engine/parsers/html-parser';
import { parseJs } from '../engine/parsers/js-parser';
import { CONCEPT_SLIDES, OPENING_DECK, SlideDefinition } from './slide-definitions';
import { shapeIssues } from './slide-shape';

const ALL: readonly SlideDefinition[] = [...OPENING_DECK, ...Object.values(CONCEPT_SLIDES).flat()];

describe('slide-definitions', () => {
  it('nao repete id de slide (o deck rastreia por ele)', () => {
    const ids = ALL.map((slide) => slide.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda parte de anatomia existe no codigo do slide', () => {
    for (const slide of ALL) {
      if (slide.anatomy) expect(() => anatomyLines(slide.anatomy!)).withContext(slide.id).not.toThrow();
    }
  });

  it('cada fase abre com o slide do conceito', () => {
    expect(CONCEPT_SLIDES.HTML[0].id).toBe('conceito-html');
    expect(CONCEPT_SLIDES.CSS[0].id).toBe('conceito-css');
    expect(CONCEPT_SLIDES.JavaScript[0].id).toBe('conceito-js');
  });
});

describe('forma dos decks', () => {
  it('abertura e cada fase cabem na forma: 3 slides, ate 3 etapas, texto curto', () => {
    const decks: Record<string, readonly SlideDefinition[]> = { abertura: OPENING_DECK, ...CONCEPT_SLIDES };
    for (const [name, deck] of Object.entries(decks)) {
      expect(shapeIssues(name, deck)).withContext(name).toEqual([]);
    }
  });

  it('o codigo dos slides de cada fase nao da erro na IDE', () => {
    const parse = { html: parseHtml, css: parseCss, js: parseJs };
    for (const slide of Object.values(CONCEPT_SLIDES).flat()) {
      for (const block of [slide.code, slide.anatomy]) {
        if (!block?.language) continue;
        const errors = parse[block.language](block.lines.join('\n')).diagnostics.filter(
          (diagnostic) => diagnostic.severity === 'erro',
        );
        expect(errors).withContext(slide.id).toEqual([]);
      }
    }
  });
});
