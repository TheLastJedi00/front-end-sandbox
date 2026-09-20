import { SourceFileId } from '../../core/models';

export type TokenKind =
  | 'plain'
  | 'tag'
  | 'bracket'
  | 'selector'
  | 'property'
  | 'value'
  | 'atrule'
  | 'keyword'
  | 'function'
  | 'string'
  | 'number'
  | 'comment';

export interface Token {
  readonly text: string;
  readonly kind: TokenKind;
}

const IDENT = /[A-Za-z_][\w-]*/y;
const WS = /\s+/y;

/** Tenta casar `re` na posicao `at`; devolve o texto casado ou null. */
function match(re: RegExp, source: string, at: number): string | null {
  re.lastIndex = at;
  const found = re.exec(source);
  return found ? found[0] : null;
}

function push(tokens: Token[], text: string, kind: TokenKind): void {
  const last = tokens.at(-1);
  if (last && last.kind === kind) {
    tokens[tokens.length - 1] = { text: last.text + text, kind };
    return;
  }
  tokens.push({ text, kind });
}

function highlightHtml(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let expectTagName = false;

  while (i < source.length) {
    const comment = match(/<!--[\s\S]*?(-->|$)/y, source, i);
    if (comment) {
      push(tokens, comment, 'comment');
      i += comment.length;
      continue;
    }

    const bracket = match(/<\/?|\/?>/y, source, i);
    if (bracket) {
      push(tokens, bracket, 'bracket');
      expectTagName = bracket.startsWith('<');
      i += bracket.length;
      continue;
    }

    const ident = match(IDENT, source, i);
    if (ident) {
      push(tokens, ident, expectTagName ? 'tag' : 'plain');
      expectTagName = false;
      i += ident.length;
      continue;
    }

    const ws = match(WS, source, i);
    push(tokens, ws ?? source[i], 'plain');
    i += ws ? ws.length : 1;
  }

  return tokens;
}

function highlightCss(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let depth = 0;
  let afterColon = false;

  while (i < source.length) {
    const comment = match(/\/\*[\s\S]*?(\*\/|$)/y, source, i);
    if (comment) {
      push(tokens, comment, 'comment');
      i += comment.length;
      continue;
    }

    const atRule = match(/@[A-Za-z-]+/y, source, i);
    if (atRule) {
      push(tokens, atRule, 'atrule');
      i += atRule.length;
      continue;
    }

    const char = source[i];
    if (char === '{') {
      depth++;
      afterColon = false;
      push(tokens, char, 'bracket');
      i++;
      continue;
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1);
      afterColon = false;
      push(tokens, char, 'bracket');
      i++;
      continue;
    }
    if (char === ':') {
      afterColon = true;
      push(tokens, char, 'plain');
      i++;
      continue;
    }
    if (char === ';' || char === '\n') {
      if (char === ';') afterColon = false;
      push(tokens, char, 'plain');
      i++;
      continue;
    }

    const number = match(/-?\d+(\.\d+)?/y, source, i);
    if (number) {
      push(tokens, number, 'number');
      i += number.length;
      continue;
    }

    const ident = match(IDENT, source, i);
    if (ident) {
      // No topo o identificador e um seletor; dentro de um bloco e propriedade
      // ate os dois-pontos e valor depois deles.
      const kind: TokenKind = depth === 0 ? 'selector' : afterColon ? 'value' : 'property';
      push(tokens, ident, kind);
      i += ident.length;
      continue;
    }

    const ws = match(WS, source, i);
    push(tokens, ws ?? char, 'plain');
    i += ws ? ws.length : 1;
  }

  return tokens;
}

const JS_KEYWORDS = new Set(['if', 'else']);

function highlightJs(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const comment = match(/\/\/[^\n]*|\/\*[\s\S]*?(\*\/|$)/y, source, i);
    if (comment) {
      push(tokens, comment, 'comment');
      i += comment.length;
      continue;
    }

    const text = match(/"[^"\n]*"?|'[^'\n]*'?/y, source, i);
    if (text) {
      push(tokens, text, 'string');
      i += text.length;
      continue;
    }

    const number = match(/-?\d+(\.\d+)?/y, source, i);
    if (number) {
      push(tokens, number, 'number');
      i += number.length;
      continue;
    }

    const ident = match(IDENT, source, i);
    if (ident) {
      const isCall = /^\s*\(/.test(source.slice(i + ident.length));
      const kind: TokenKind = JS_KEYWORDS.has(ident) ? 'keyword' : isCall ? 'function' : 'plain';
      push(tokens, ident, kind);
      i += ident.length;
      continue;
    }

    const ws = match(WS, source, i);
    push(tokens, ws ?? source[i], 'plain');
    i += ws ? ws.length : 1;
  }

  return tokens;
}

export function highlight(source: string, language: SourceFileId): Token[] {
  switch (language) {
    case 'html':
      return highlightHtml(source);
    case 'css':
      return highlightCss(source);
    case 'js':
      return highlightJs(source);
  }
}
