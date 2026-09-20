import { Diagnostic, diagnostic } from '../../core/models';

/** Propriedades que o jogo entende dentro de um seletor. */
export const ALLOWED_PROPERTIES = ['color', 'animation'] as const;
/** Propriedade unica aceita dentro de um passo de animacao. */
export const KEYFRAME_PROPERTY = 'position';
/** Os tres momentos da animacao, na ordem em que acontecem. */
export const KEYFRAME_STEPS = ['inicio', 'meio', 'fim'] as const;
export type KeyframeStep = (typeof KEYFRAME_STEPS)[number];

export interface CssRule {
  readonly selector: string;
  readonly line: number;
  readonly declarations: Readonly<Record<string, string>>;
}

export interface Keyframe {
  readonly step: KeyframeStep;
  readonly position: number;
  readonly line: number;
}

export interface CssAnimation {
  readonly name: string;
  readonly line: number;
  readonly keyframes: readonly Keyframe[];
}

export interface CssParseResult {
  readonly rules: readonly CssRule[];
  readonly animations: readonly CssAnimation[];
  readonly diagnostics: readonly Diagnostic[];
}

type Report = (line: number, message: string, severity?: 'erro' | 'aviso') => void;

interface Block {
  readonly header: string;
  readonly headerLine: number;
  readonly body: string;
  /** Linha, no arquivo inteiro, em que o corpo do bloco comeca. */
  readonly bodyLine: number;
}

function countLines(text: string, until: number): number {
  let lines = 0;
  for (let i = 0; i < until && i < text.length; i++) {
    if (text[i] === '\n') lines++;
  }
  return lines;
}

function stripComments(source: string): string {
  // Troca o comentario por espacos em vez de remove-lo, para que as linhas
  // relatadas continuem batendo com o que o aluno ve na tela.
  return source.replace(/\/\*[\s\S]*?(\*\/|$)/g, (found) => found.replace(/[^\n]/g, ' '));
}

/** Quebra o texto em blocos `cabecalho { corpo }`, respeitando aninhamento. */
function splitBlocks(source: string, baseLine: number, report: Report): Block[] {
  const blocks: Block[] = [];
  let header = '';
  let headerStart = 0;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (char === '{') {
      let depth = 1;
      let end = i + 1;
      while (end < source.length && depth > 0) {
        if (source[end] === '{') depth++;
        if (source[end] === '}') depth--;
        end++;
      }
      const unbalanced = depth > 0;
      if (unbalanced) {
        report(baseLine + countLines(source, i), 'Faltou fechar este bloco com "}".');
      }
      const bodyEnd = unbalanced ? source.length : end - 1;

      blocks.push({
        header: header.trim(),
        headerLine: baseLine + countLines(source, headerStart),
        body: source.slice(i + 1, bodyEnd),
        bodyLine: baseLine + countLines(source, i + 1),
      });

      i = bodyEnd;
      header = '';
      headerStart = i + 1;
      continue;
    }

    if (char === '}') {
      report(baseLine + countLines(source, i), 'Apareceu um "}" sem um "{" correspondente.');
      header = '';
      headerStart = i + 1;
      continue;
    }

    if (!header && /\s/.test(char)) {
      headerStart = i + 1;
      continue;
    }
    header += char;
  }

  if (header.trim()) {
    report(
      baseLine + countLines(source, headerStart),
      `Faltou abrir o bloco de "${header.trim()}" com "{".`,
    );
  }

  return blocks;
}

/** Le as declaracoes `propriedade: valor` de dentro de um bloco. */
function parseDeclarations(
  block: Block,
  allowed: readonly string[],
  report: Report,
): Record<string, string> {
  const declarations: Record<string, string> = {};
  let consumed = 0;

  for (const piece of block.body.split(/[;\n]/)) {
    const line = block.bodyLine + countLines(block.body, consumed);
    consumed += piece.length + 1;

    const text = piece.trim();
    if (!text || text.includes('{') || text.includes('}')) continue;

    const colon = text.indexOf(':');
    if (colon === -1) {
      report(line, `Faltaram os dois-pontos em "${text}". Escreva assim: color: red`);
      continue;
    }

    const property = text.slice(0, colon).trim().toLowerCase();
    const value = text.slice(colon + 1).trim();

    if (!value) {
      report(line, `A propriedade "${property}" ficou sem valor.`);
      continue;
    }
    if (!allowed.includes(property)) {
      report(
        line,
        `A propriedade "${property}" não faz nada aqui. As que funcionam são: ${allowed.join(', ')}.`,
        'aviso',
      );
      continue;
    }

    declarations[property] = value;
  }

  return declarations;
}

function parseAnimation(block: Block, report: Report): CssAnimation | null {
  const name = block.header.replace(/^@animation/i, '').trim().toLowerCase();
  if (!name) {
    report(block.headerLine, 'A animação precisa de um nome. Exemplo: @animation jump { ... }');
    return null;
  }

  const keyframes: Keyframe[] = [];
  for (const step of splitBlocks(block.body, block.bodyLine, report)) {
    const at = step.header.toLowerCase();
    if (!(KEYFRAME_STEPS as readonly string[]).includes(at)) {
      report(
        step.headerLine,
        `"${step.header}" não é um momento da animação. Use ${KEYFRAME_STEPS.join(', ')}.`,
      );
      continue;
    }

    const declarations = parseDeclarations(step, [KEYFRAME_PROPERTY], report);
    const raw = declarations[KEYFRAME_PROPERTY];
    if (raw === undefined) {
      report(step.headerLine, `Falta dizer a "position" no momento "${at}".`);
      continue;
    }

    const position = Number(raw);
    if (!Number.isFinite(position)) {
      report(step.headerLine, `"${raw}" não é um número. Use 0 para o chão e 1 para o alto.`);
      continue;
    }

    keyframes.push({ step: at as KeyframeStep, position, line: step.headerLine });
  }

  const faltando = KEYFRAME_STEPS.filter((step) => !keyframes.some((k) => k.step === step));
  if (keyframes.length > 0 && faltando.length > 0) {
    report(
      block.headerLine,
      `A animação "${name}" está sem: ${faltando.join(', ')}.`,
      'aviso',
    );
  }

  return { name, line: block.headerLine, keyframes };
}

/** Le a aparencia e as animacoes declaradas pelo aluno. */
export function parseCss(source: string): CssParseResult {
  const clean = stripComments(source);
  const diagnostics: Diagnostic[] = [];
  const report: Report = (line, message, severity = 'erro') =>
    diagnostics.push(diagnostic('css', line, message, severity));

  const rules: CssRule[] = [];
  const animations: CssAnimation[] = [];

  for (const block of splitBlocks(clean, 1, report)) {
    if (/^@animation\b/i.test(block.header)) {
      const animation = parseAnimation(block, report);
      if (animation) animations.push(animation);
      continue;
    }
    if (block.header.startsWith('@')) {
      report(block.headerLine, `A regra "${block.header}" não existe neste jogo.`);
      continue;
    }
    if (!block.header) {
      report(block.headerLine, 'Este bloco não diz a qual elemento ele se aplica.');
      continue;
    }

    rules.push({
      selector: block.header.toLowerCase(),
      line: block.headerLine,
      declarations: parseDeclarations(block, ALLOWED_PROPERTIES, report),
    });
  }

  return { rules, animations, diagnostics };
}

/** Ultimo valor declarado para uma propriedade de um seletor. */
export function declaredValue(
  result: CssParseResult,
  selector: string,
  property: string,
): string | undefined {
  let value: string | undefined;
  for (const rule of result.rules) {
    if (rule.selector === selector && rule.declarations[property] !== undefined) {
      value = rule.declarations[property];
    }
  }
  return value;
}

export function findAnimation(result: CssParseResult, name: string): CssAnimation | undefined {
  return result.animations.find((animation) => animation.name === name.toLowerCase());
}
