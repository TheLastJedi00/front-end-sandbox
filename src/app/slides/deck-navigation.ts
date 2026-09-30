import { SlideDefinition } from './slide-definitions';

/**
 * Onde a apresentacao esta: qual slide e quantas etapas dele ja foram
 * reveladas. `step` vai de 0 (so titulo e texto) ate `stepsOf(slide)`.
 */
export interface DeckPosition {
  readonly slide: number;
  readonly step: number;
}

export const DECK_START: DeckPosition = { slide: 0, step: 0 };

/**
 * Quantas etapas o slide tem: um ponto por vez e, depois deles, uma parte da
 * anatomia por vez. O resto do slide (titulo, texto, codigo, arvore) entra
 * sozinho, sem esperar o apresentador.
 */
export function stepsOf(slide: SlideDefinition): number {
  return (slide.points?.length ?? 0) + (slide.anatomy?.parts.length ?? 0);
}

/** O slide com todas as etapas ja reveladas. */
export function completed(slides: readonly SlideDefinition[], slide: number): DeckPosition {
  return { slide, step: stepsOf(slides[slide]) };
}

/**
 * Avancar revela a proxima etapa; sem etapa pendente, vai para o proximo
 * slide. Depois do ultimo slide completo nao ha para onde ir: `null`, e quem
 * chamou decide encerrar o deck.
 */
export function advance(
  slides: readonly SlideDefinition[],
  { slide, step }: DeckPosition,
): DeckPosition | null {
  if (step < stepsOf(slides[slide])) return { slide, step: step + 1 };
  if (slide < slides.length - 1) return { slide: slide + 1, step: 0 };
  return null;
}

/**
 * Voltar desfaz a ultima etapa, como no PowerPoint. Do comeco de um slide, o
 * slide anterior volta ja completo — ninguem quer rever as etapas de tras
 * para frente.
 */
export function retreat(
  slides: readonly SlideDefinition[],
  { slide, step }: DeckPosition,
): DeckPosition {
  if (step > 0) return { slide, step: step - 1 };
  if (slide > 0) return completed(slides, slide - 1);
  return { slide, step };
}
