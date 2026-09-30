import { highlightLines, Token } from '../../ide/code-editor/highlight';
import { AnatomyPart, SlideAnatomy } from '../slide-definitions';

/** Pedaco de uma linha: tokens com realce e, se for o caso, a parte que ele e. */
export interface AnatomySegment {
  readonly tokens: readonly Token[];
  /** Indice em `anatomy.parts`; ausente no codigo que nao tem nome. */
  readonly part?: number;
}

interface Range {
  readonly start: number;
  readonly end: number;
  readonly part: number;
}

/** Posicao da n-esima ocorrencia de `part.text` na linha. */
function locate(line: string, part: AnatomyPart): number {
  let at = -1;
  for (let n = 0; n <= (part.occurrence ?? 0); n++) {
    at = line.indexOf(part.text, at + 1);
    if (at < 0) break;
  }

  if (at < 0) {
    // Erro de quem escreveu o slide, nao do aluno: melhor quebrar no teste.
    throw new Error(`Parte "${part.label}" nao encontrada: "${part.text}" em "${line}"`);
  }
  return at;
}

/** Os tokens que caem dentro de [from, to), cortados nas bordas. */
function slice(tokens: readonly Token[], from: number, to: number): Token[] {
  const out: Token[] = [];
  let offset = 0;

  for (const token of tokens) {
    const start = Math.max(from, offset);
    const end = Math.min(to, offset + token.text.length);
    if (start < end) {
      out.push({ text: token.text.slice(start - offset, end - offset), kind: token.kind });
    }
    offset += token.text.length;
  }

  return out;
}

/**
 * Quebra cada linha em segmentos: os trechos que tem nome viram segmentos
 * proprios, o resto fica entre eles. O realce e o mesmo da IDE.
 */
export function anatomyLines(anatomy: SlideAnatomy): AnatomySegment[][] {
  const highlighted = highlightLines(anatomy.lines.join('\n'), anatomy.language);

  return anatomy.lines.map((line, index) => {
    const tokens = highlighted[index];
    const ranges: Range[] = anatomy.parts
      .map((part, i) => ({ part, i }))
      .filter(({ part }) => part.line === index)
      .map(({ part, i }) => {
        const start = locate(line, part);
        return { start, end: start + part.text.length, part: i };
      })
      .sort((a, b) => a.start - b.start);

    const segments: AnatomySegment[] = [];
    let cursor = 0;
    for (const range of ranges) {
      if (range.start < cursor) {
        throw new Error(`Partes sobrepostas na linha ${index}: "${line}"`);
      }
      if (range.start > cursor) segments.push({ tokens: slice(tokens, cursor, range.start) });
      segments.push({ tokens: slice(tokens, range.start, range.end), part: range.part });
      cursor = range.end;
    }
    if (cursor < line.length) segments.push({ tokens: slice(tokens, cursor, line.length) });

    return segments;
  });
}
