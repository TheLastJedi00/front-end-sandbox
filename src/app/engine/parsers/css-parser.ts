import { Diagnostic, diagnostic } from '../../core/models';

/** Propriedades que o jogo entende dentro de um seletor. */
export const ALLOWED_PROPERTIES = ['color', 'animation'] as const;

export interface CssRule {
  readonly selector: string;
  readonly line: number;
  readonly declarations: Readonly<Record<string, string>>;
}

export interface CssParseResult {
  readonly rules: readonly CssRule[];
  readonly diagnostics: readonly Diagnostic[];
}

interface Block {
  readonly header: string;
  readonly headerLine: number;
  readonly body: string;
  readonly bodyStart: number;
}

function lineAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

function stripComments(source: string): string {
  // Mantem o tamanho original trocando o comentario por espacos, para que as
  // linhas relatadas continuem batendo com o que o aluno ve na tela.
  return source.replace(/\/\*[\s\S]*?(\*\/|$)/g, (found) =>
    found.replace(/[^\n]/g, ' '),
  );
}

/** Quebra o texto em blocos `cabecalho { corpo }`, respeitando aninhamento. */
export function splitBlocks(
  source: string,
  report: (line: number, message: string) => void,
): Block[] {
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
      if (depth > 0) {
        report(lineAt(source, i), 'Faltou fechar este bloco com "}".');
      }
      const bodyEnd = depth > 0 ? source.length : end - 1;
      blocks.push({
        header: header.trim(),
        headerLine: lineAt(source, headerStart + (header.length - header.trimStart().length)),
        body: source.slice(i + 1, bodyEnd),
        bodyStart: i + 1,
      });
      i = bodyEnd;
      header = '';
      headerStart = i + 1;
      continue;
    }

    if (char === '}') {
      report(lineAt(source, i), 'Apareceu um "}" sem um "{" correspondente.');
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
    report(lineAt(source, headerStart), `Faltou abrir o bloco de "${header.trim()}" com "{".`);
  }

  return blocks;
}

/** Le as declaracoes `propriedade: valor` de dentro de um bloco. */
export function parseDeclarations(
  block: Block,
  source: string,
  allowed: readonly string[],
  report: (line: number, message: string, severity?: 'erro' | 'aviso') => void,
): Record<string, string> {
  const declarations: Record<string, string> = {};

  let offset = 0;
  for (const piece of block.body.split(/[;\n]/)) {
    const absolute = block.bodyStart + offset;
    offset += piece.length + 1;

    const text = piece.trim();
    if (!text || text.includes('{') || text.includes('}')) continue;

    const line = lineAt(source, absolute + (piece.length - piece.trimStart().length));
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

/** Le a aparencia declarada pelo aluno. */
export function parseCss(source: string): CssParseResult {
  const clean = stripComments(source);
  const diagnostics: Diagnostic[] = [];
  const report = (line: number, message: string, severity: 'erro' | 'aviso' = 'erro') =>
    diagnostics.push(diagnostic('css', line, message, severity));

  const rules: CssRule[] = [];

  for (const block of splitBlocks(clean, report)) {
    if (block.header.startsWith('@')) {
      report(block.headerLine, `A regra "${block.header}" ainda não é usada nesta fase.`, 'aviso');
      continue;
    }
    if (!block.header) {
      report(block.headerLine, 'Este bloco não diz a qual elemento ele se aplica.');
      continue;
    }

    rules.push({
      selector: block.header.toLowerCase(),
      line: block.headerLine,
      declarations: parseDeclarations(block, clean, ALLOWED_PROPERTIES, report),
    });
  }

  return { rules, diagnostics };
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
