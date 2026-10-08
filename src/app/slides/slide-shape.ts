import { stepsOf } from './deck-navigation';
import { SlideDefinition } from './slide-definitions';

/**
 * A forma de todo deck: o mesmo numero de slides em cada etapa da aula e pouco
 * texto em cada slide, para que cada slide caiba na meta de tempo e cada etapa
 * dure o mesmo minuto.
 */
export const SHAPE = {
  slidesPerDeck: 3,
  maxSteps: 3,
  maxTitleWords: 6,
  maxLeadChars: 80,
  maxPointChars: 60,
  maxNoteChars: 60,
  maxCodeLines: 5,
} as const;

/** Frases que mandam o apresentador clicar: o slide nao deve precisar delas. */
const NAVIGATION_HINT = /\bavanc/i;

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slideIssues(slide: SlideDefinition): string[] {
  const issues: string[] = [];
  const at = (problem: string) => issues.push(`${slide.id}: ${problem}`);

  const steps = stepsOf(slide);
  if (steps > SHAPE.maxSteps) at(`${steps} etapas, máximo ${SHAPE.maxSteps}`);

  const titleWords = words(slide.title);
  if (titleWords > SHAPE.maxTitleWords) {
    at(`título com ${titleWords} palavras, máximo ${SHAPE.maxTitleWords}`);
  }

  if (slide.lead !== undefined) {
    if (slide.lead.length > SHAPE.maxLeadChars) {
      at(`texto de apoio com ${slide.lead.length} caracteres, máximo ${SHAPE.maxLeadChars}`);
    }
    if (NAVIGATION_HINT.test(slide.lead)) at('texto de apoio manda avançar');
  }

  for (const point of slide.points ?? []) {
    if (point.text.length > SHAPE.maxPointChars) {
      at(`ponto "${point.label}" com ${point.text.length} caracteres, máximo ${SHAPE.maxPointChars}`);
    }
  }

  for (const part of slide.anatomy?.parts ?? []) {
    if (part.note.length > SHAPE.maxNoteChars) {
      at(`nota de "${part.label}" com ${part.note.length} caracteres, máximo ${SHAPE.maxNoteChars}`);
    }
  }

  const lines = Math.max(slide.code?.lines.length ?? 0, slide.anatomy?.lines.length ?? 0);
  if (lines > SHAPE.maxCodeLines) at(`${lines} linhas de código, máximo ${SHAPE.maxCodeLines}`);

  return issues;
}

/**
 * Tudo que tira o deck da forma, em frases legiveis. Lista vazia: o deck cabe
 * na meta. Funcao pura — e o teste dos decks que a usa.
 */
export function shapeIssues(name: string, deck: readonly SlideDefinition[]): string[] {
  const issues = deck.flatMap(slideIssues);
  if (deck.length !== SHAPE.slidesPerDeck) {
    issues.unshift(`${name}: ${deck.length} slides, devem ser ${SHAPE.slidesPerDeck}`);
  }
  return issues;
}
