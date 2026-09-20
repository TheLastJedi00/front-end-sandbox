import { findNode, isInside, parseHtml } from './html-parser';

describe('parseHtml', () => {
  it('monta a arvore esperada da fase 1', () => {
    const result = parseHtml('<sky>\n  <ball></ball>\n  <ground></ground>\n</sky>');

    expect(result.diagnostics).toEqual([]);
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].tag).toBe('sky');
    expect(result.nodes[0].children.map((node) => node.tag)).toEqual(['ball', 'ground']);
    expect(isInside(result.nodes, 'sky', 'ball')).toBeTrue();
  });

  it('aceita etiqueta que se fecha sozinha', () => {
    const result = parseHtml('<sky><ball /></sky>');

    expect(result.diagnostics).toEqual([]);
    expect(findNode(result.nodes, 'ball')).toBeDefined();
  });

  it('reclama de etiqueta desconhecida sem quebrar o resto', () => {
    const result = parseHtml('<sky><star></star><ball></ball></sky>');

    // Abrir e fechar a mesma etiqueta desconhecida gera um unico aviso.
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].message).toContain('<star>');
    expect(isInside(result.nodes, 'sky', 'ball')).toBeTrue();
  });

  it('avisa quando uma etiqueta fica sem fechar', () => {
    const result = parseHtml('<sky>\n  <ball>\n</sky>');

    const messages = result.diagnostics.map((d) => d.message).join(' ');
    expect(messages).toContain('</ball>');
  });

  it('aponta a linha do erro', () => {
    const result = parseHtml('<sky>\n\n  <star></star>\n</sky>');

    expect(result.diagnostics[0].line).toBe(3);
    expect(result.diagnostics[0].file).toBe('html');
  });

  it('trata texto solto como aviso, nao como erro', () => {
    const result = parseHtml('<sky>ola</sky>');

    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].severity).toBe('aviso');
  });

  it('nao encontra a bola quando ela esta fora do ceu', () => {
    const result = parseHtml('<ball></ball><sky></sky>');

    expect(isInside(result.nodes, 'sky', 'ball')).toBeFalse();
  });
});
