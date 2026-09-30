import { anatomyLines } from './code-anatomy/anatomy';
import { CONCEPT_SLIDES, OPENING_DECK, SlideDefinition } from './slide-definitions';

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
