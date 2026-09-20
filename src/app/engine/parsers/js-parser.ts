import { Diagnostic, diagnostic } from '../../core/models';

/** Teclas que o jogo escuta. */
export const KNOWN_KEYS = ['A', 'D', 'SPACE'] as const;

export type Action =
  | { readonly kind: 'avancar' }
  | { readonly kind: 'recuar' }
  | { readonly kind: 'animar'; readonly target: string; readonly animation: string };

export interface KeyHandler {
  /** Tecla ja normalizada em maiusculas: A, D ou SPACE. */
  readonly key: string;
  readonly line: number;
  readonly actions: readonly Action[];
}

export interface JsParseResult {
  readonly handlers: readonly KeyHandler[];
  readonly diagnostics: readonly Diagnostic[];
}

type Report = (line: number, message: string, severity?: 'erro' | 'aviso') => void;

const IF_BLOCK = /if\s*\(\s*key\s*\(\s*(["'])(.*?)\1\s*\)\s*\)\s*\{([^{}]*)\}/giy;
const MOVE = /^(avancar|recuar)\s*\(\s*\)$/i;
const ANIMATE = /^element\s*\(\s*(["'])(.*?)\1\s*\)\s*\.\s*animation\s*\(\s*(["'])(.*?)\3\s*\)$/i;

function countLines(text: string, until: number): number {
  let lines = 0;
  for (let i = 0; i < until && i < text.length; i++) {
    if (text[i] === '\n') lines++;
  }
  return lines;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?(\*\/|$)/g, (found) => found.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (found) => ' '.repeat(found.length));
}

function parseActions(body: string, bodyLine: number, report: Report): Action[] {
  const actions: Action[] = [];
  let consumed = 0;

  for (const piece of body.split(/[;\n]/)) {
    const line = bodyLine + countLines(body, consumed);
    consumed += piece.length + 1;

    const text = piece.trim();
    if (!text) continue;

    const move = MOVE.exec(text);
    if (move) {
      actions.push({ kind: move[1].toLowerCase() === 'avancar' ? 'avancar' : 'recuar' });
      continue;
    }

    const animate = ANIMATE.exec(text);
    if (animate) {
      actions.push({
        kind: 'animar',
        target: animate[2].toLowerCase(),
        animation: animate[4].toLowerCase(),
      });
      continue;
    }

    report(
      line,
      `Não entendi o comando "${text}". Os comandos são avancar(), recuar() e element("ball").animation("jump").`,
    );
  }

  return actions;
}

/**
 * Le o comportamento escrito pelo aluno. Nao executa nada do que foi digitado:
 * o texto vira uma lista de acoes por tecla, e quem as aplica e o game loop.
 */
export function parseJs(source: string): JsParseResult {
  const clean = stripComments(source);
  const diagnostics: Diagnostic[] = [];
  const report: Report = (line, message, severity = 'erro') =>
    diagnostics.push(diagnostic('js', line, message, severity));

  const handlers: KeyHandler[] = [];
  const covered: Array<[number, number]> = [];

  for (const found of clean.matchAll(/\bif\b/gi)) {
    const start = found.index;
    IF_BLOCK.lastIndex = start;
    const block = IF_BLOCK.exec(clean);
    const line = 1 + countLines(clean, start);

    if (!block) {
      report(
        line,
        'Escreva a condição assim: if(key("D")) { avancar() }',
      );
      continue;
    }

    const key = block[2].trim().toUpperCase();
    if (!(KNOWN_KEYS as readonly string[]).includes(key)) {
      report(line, `A tecla "${block[2]}" não é lida pelo jogo. Use A, D ou space.`, 'aviso');
    }

    const bodyStart = start + block[0].lastIndexOf('{') + 1;
    handlers.push({
      key,
      line,
      actions: parseActions(block[3], 1 + countLines(clean, bodyStart), report),
    });
    covered.push([start, start + block[0].length]);
  }

  // Sobrou codigo fora de qualquer if? Avisa, em vez de ignorar em silencio.
  let leftover = clean;
  for (const [start, end] of covered) {
    leftover = leftover.slice(0, start) + ' '.repeat(end - start) + leftover.slice(end);
  }
  for (const piece of leftover.matchAll(/[^\s;]+/g)) {
    report(
      1 + countLines(clean, piece.index),
      `"${piece[0]}" está fora de um if e por isso não foi executado.`,
      'aviso',
    );
    break;
  }

  return { handlers, diagnostics };
}

export function handlerFor(result: JsParseResult, key: string): KeyHandler | undefined {
  return result.handlers.find((handler) => handler.key === key.toUpperCase());
}
