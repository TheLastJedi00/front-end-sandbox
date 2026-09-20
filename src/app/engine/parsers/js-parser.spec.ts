import { handlerFor, parseJs } from './js-parser';

describe('parseJs', () => {
  it('le os tres comandos da fase 3', () => {
    const result = parseJs(`
    if(key("D")){
        avancar()
    }
    if(key("A")){
        recuar()
    }
    if(key("space")){
        element("ball").animation("jump")
    }`);

    expect(result.diagnostics).toEqual([]);
    expect(handlerFor(result, 'D')!.actions).toEqual([{ kind: 'avancar' }]);
    expect(handlerFor(result, 'A')!.actions).toEqual([{ kind: 'recuar' }]);
    expect(handlerFor(result, 'space')!.actions).toEqual([
      { kind: 'animar', target: 'ball', animation: 'jump' },
    ]);
  });

  it('aceita espacos, aspas simples e ponto e virgula', () => {
    const result = parseJs("if ( key( 'd' ) ) { avancar(); }");

    expect(result.diagnostics).toEqual([]);
    expect(handlerFor(result, 'D')!.actions).toEqual([{ kind: 'avancar' }]);
  });

  it('aceita mais de uma acao no mesmo if', () => {
    const result = parseJs('if(key("space")){ avancar()\n element("ball").animation("jump") }');

    expect(handlerFor(result, 'space')!.actions.length).toBe(2);
  });

  it('reclama de comando desconhecido', () => {
    const result = parseJs('if(key("D")){ pular() }');

    expect(result.diagnostics[0].severity).toBe('erro');
    expect(result.diagnostics[0].message).toContain('pular()');
  });

  it('reclama quando a condicao esta malformada', () => {
    const result = parseJs('if key("D") { avancar() }');

    expect(result.diagnostics[0].message).toContain('if(key("D"))');
  });

  it('avisa sobre tecla que o jogo nao escuta', () => {
    const result = parseJs('if(key("W")){ avancar() }');

    expect(result.diagnostics[0].severity).toBe('aviso');
    expect(result.diagnostics[0].message).toContain('A, D ou space');
  });

  it('avisa sobre comando solto fora de um if', () => {
    const result = parseJs('avancar()');

    expect(result.diagnostics[0].severity).toBe('aviso');
    expect(result.handlers).toEqual([]);
  });

  it('aponta a linha do comando com erro', () => {
    const result = parseJs('if(key("D")){\n  pular()\n}');

    expect(result.diagnostics[0].line).toBe(2);
  });

  it('ignora comentarios', () => {
    const result = parseJs('// anda para a direita\nif(key("D")){ avancar() }');

    expect(result.diagnostics).toEqual([]);
    expect(result.handlers.length).toBe(1);
  });
});
