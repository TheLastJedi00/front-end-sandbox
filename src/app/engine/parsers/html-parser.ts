import { Diagnostic, diagnostic } from '../../core/models';

/** As unicas etiquetas que existem neste jogo. */
export const ALLOWED_TAGS = ['sky', 'ground', 'ball'] as const;
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

export interface HtmlNode {
  readonly tag: AllowedTag;
  readonly line: number;
  readonly children: HtmlNode[];
}

export interface HtmlParseResult {
  readonly nodes: readonly HtmlNode[];
  readonly diagnostics: readonly Diagnostic[];
}

interface OpenTag {
  readonly node: HtmlNode;
  readonly line: number;
}

const CHUNK = /<[^<>]*>?|[^<]+/g;
const TAG_SHAPE = /^<\s*(\/?)\s*([A-Za-z][\w-]*)\s*(\/?)\s*>$/;

function isAllowed(tag: string): tag is AllowedTag {
  return (ALLOWED_TAGS as readonly string[]).includes(tag);
}

function lineAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

/**
 * Le a estrutura que o aluno escreveu e devolve a arvore de elementos.
 * Os erros sao escritos para quem nunca viu HTML: dizem o que fazer, nao
 * qual regra da gramatica foi violada.
 */
export function parseHtml(source: string): HtmlParseResult {
  const roots: HtmlNode[] = [];
  const stack: OpenTag[] = [];
  const diagnostics: Diagnostic[] = [];

  const add = (line: number, message: string, severity: 'erro' | 'aviso' = 'erro') =>
    diagnostics.push(diagnostic('html', line, message, severity));

  for (const found of source.matchAll(CHUNK)) {
    const chunk = found[0];
    const line = lineAt(source, found.index);

    if (!chunk.startsWith('<')) {
      if (chunk.trim()) {
        add(line, `Este jogo só entende etiquetas; o texto solto "${chunk.trim()}" foi ignorado.`, 'aviso');
      }
      continue;
    }

    if (!chunk.endsWith('>')) {
      add(line, 'Faltou fechar esta etiqueta com ">".');
      continue;
    }

    if (chunk.startsWith('<!--')) continue;

    const shape = TAG_SHAPE.exec(chunk);
    if (!shape) {
      add(line, `Não entendi "${chunk}". Uma etiqueta se escreve assim: <ball></ball>.`);
      continue;
    }

    const [, closing, name, selfClosing] = shape;
    const tag = name.toLowerCase();

    if (!isAllowed(tag)) {
      add(line, `A etiqueta <${tag}> não existe aqui. As que existem são: ${ALLOWED_TAGS.join(', ')}.`);
      continue;
    }

    if (closing) {
      const open = stack.pop();
      if (!open) {
        add(line, `Apareceu </${tag}> sem que <${tag}> tivesse sido aberta antes.`);
        continue;
      }
      if (open.node.tag !== tag) {
        add(line, `Você abriu <${open.node.tag}> e fechou </${tag}>. Feche primeiro </${open.node.tag}>.`);
        stack.push(open);
      }
      continue;
    }

    const node: HtmlNode = { tag, line, children: [] };
    const parent = stack.at(-1);
    if (parent) {
      parent.node.children.push(node);
    } else {
      roots.push(node);
    }

    if (!selfClosing) stack.push({ node, line });
  }

  for (const open of stack) {
    add(open.line, `Faltou fechar a etiqueta <${open.node.tag}> com </${open.node.tag}>.`);
  }

  return { nodes: roots, diagnostics };
}

/** Procura o primeiro no de uma etiqueta em toda a arvore. */
export function findNode(nodes: readonly HtmlNode[], tag: AllowedTag): HtmlNode | undefined {
  for (const node of nodes) {
    if (node.tag === tag) return node;
    const inside = findNode(node.children, tag);
    if (inside) return inside;
  }
  return undefined;
}

/** Diz se `child` esta dentro de `parent` em qualquer profundidade. */
export function isInside(nodes: readonly HtmlNode[], parent: AllowedTag, child: AllowedTag): boolean {
  const container = findNode(nodes, parent);
  return container ? findNode(container.children, child) !== undefined : false;
}
