import { declaredValue, findAnimation, parseCss } from './css-parser';

describe('parseCss', () => {
  it('le as cores da fase 1', () => {
    const result = parseCss(`
sky {
    color: blue;
}
ball {
    color: red;
}
ground {
    color: green;
}`);

    expect(result.diagnostics).toEqual([]);
    expect(declaredValue(result, 'sky', 'color')).toBe('blue');
    expect(declaredValue(result, 'ball', 'color')).toBe('red');
    expect(declaredValue(result, 'ground', 'color')).toBe('green');
  });

  it('aceita declaracao sem ponto e virgula no fim', () => {
    const result = parseCss('ball {\n  color: red\n}');

    expect(result.diagnostics).toEqual([]);
    expect(declaredValue(result, 'ball', 'color')).toBe('red');
  });

  it('le o bloco @animation da fase 2', () => {
    const result = parseCss(`
ball {
    color: red;
    animation: jump
}

@animation jump {
    inicio {
        position: 0
    }
    meio {
        position: 1
    }
    fim {
        position: 0
    }
}`);

    expect(result.diagnostics).toEqual([]);
    expect(declaredValue(result, 'ball', 'animation')).toBe('jump');

    const jump = findAnimation(result, 'jump');
    expect(jump).toBeDefined();
    expect(jump!.keyframes.map((frame) => frame.step)).toEqual(['inicio', 'meio', 'fim']);
    expect(jump!.keyframes.map((frame) => frame.position)).toEqual([0, 1, 0]);
  });

  it('avisa quando falta um momento da animacao', () => {
    const result = parseCss('@animation jump {\n inicio { position: 0 }\n fim { position: 0 }\n}');

    expect(result.diagnostics[0].message).toContain('meio');
    expect(result.diagnostics[0].severity).toBe('aviso');
  });

  it('avisa sobre propriedade que nao faz nada', () => {
    const result = parseCss('ball {\n  tamanho: 10\n}');

    expect(result.diagnostics[0].severity).toBe('aviso');
    expect(result.diagnostics[0].line).toBe(2);
  });

  it('reclama de declaracao sem dois-pontos', () => {
    const result = parseCss('ball {\n  color red\n}');

    expect(result.diagnostics[0].severity).toBe('erro');
    expect(result.diagnostics[0].message).toContain('dois-pontos');
  });

  it('reclama de bloco que nao foi fechado', () => {
    const result = parseCss('ball {\n  color: red');

    expect(result.diagnostics.some((d) => d.message.includes('}'))).toBeTrue();
  });

  it('ignora comentarios sem perder a contagem de linhas', () => {
    const result = parseCss('/* a cor da bola */\nball {\n  tamanho: 10\n}');

    expect(result.diagnostics[0].line).toBe(3);
  });

  it('usa a ultima declaracao quando o seletor se repete', () => {
    const result = parseCss('ball { color: red }\nball { color: green }');

    expect(declaredValue(result, 'ball', 'color')).toBe('green');
  });
});
