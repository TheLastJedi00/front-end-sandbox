import { LevelConcept, SourceFileId } from '../core/models';

export interface GhostContext {
  readonly text: string;
  readonly caret: number;
  readonly file: SourceFileId;
  readonly concept: LevelConcept;
}

export interface GhostSuggestion {
  /** Texto proposto, inserido tal como esta na posicao do cursor. */
  readonly insert: string;
  /** Uma linha dizendo o que a sugestao faz, para o leitor de tela e o botao. */
  readonly summary: string;
}

/**
 * Passos de cada fase, na ordem em que fazem sentido. O primeiro passo que ainda
 * nao esta no codigo e o que a sugestao oferece — e por isso ela acompanha o
 * aluno em vez de despejar a fase pronta.
 */
interface Step {
  readonly summary: string;
  readonly block: string;
  /** Ja esta feito? */
  readonly done: (code: string) => boolean;
}

const STEPS: Readonly<Record<LevelConcept, readonly Step[]>> = {
  HTML: [
    {
      summary: 'criar o céu',
      block: '<sky>\n\n</sky>',
      done: (code) => /<sky>/.test(code),
    },
    {
      summary: 'colocar a bola dentro do céu',
      block: '    <ball></ball>',
      done: (code) => /<ball>\s*<\/ball>/.test(code),
    },
    {
      summary: 'colocar o terreno dentro do céu',
      block: '    <ground></ground>',
      done: (code) => /<ground>\s*<\/ground>/.test(code),
    },
  ],
  CSS: [
    {
      summary: 'pintar o céu de azul',
      block: 'sky {\n    color: blue;\n}',
      done: (code) => /sky\s*\{[^}]*color\s*:/.test(code),
    },
    {
      summary: 'pintar a bola de vermelho',
      block: 'ball {\n    color: red;\n}',
      done: (code) => /ball\s*\{[^}]*color\s*:/.test(code),
    },
    {
      summary: 'pintar o terreno de verde',
      block: 'ground {\n    color: green;\n}',
      done: (code) => /ground\s*\{[^}]*color\s*:/.test(code),
    },
    {
      summary: 'declarar a animação do pulo',
      block:
        '@animation jump {\n    inicio {\n        position: 0\n    }\n    meio {\n        position: 1\n    }\n    fim {\n        position: 0\n    }\n}',
      done: (code) => /@animation\s+\w+/.test(code),
    },
    {
      summary: 'aplicar a animação na bola',
      block: 'ball {\n    animation: jump\n}',
      done: (code) => /ball\s*\{[^}]*animation\s*:/.test(code),
    },
  ],
  JavaScript: [
    {
      summary: 'avançar com a tecla D',
      block: 'if(key("D")){\n    avancar()\n}',
      done: (code) => /key\(\s*"D"\s*\)/i.test(code),
    },
    {
      summary: 'recuar com a tecla A',
      block: 'if(key("A")){\n    recuar()\n}',
      done: (code) => /key\(\s*"A"\s*\)/i.test(code),
    },
    {
      summary: 'pular com a barra de espaço',
      block: 'if(key("space")){\n    element("ball").animation("jump")\n}',
      done: (code) => /key\(\s*"space"\s*\)/i.test(code),
    },
  ],
};

/** O arquivo em que cada conceito trabalha; nos outros a sugestao nao aparece. */
const FILE_OF: Readonly<Record<LevelConcept, SourceFileId>> = {
  HTML: 'html',
  CSS: 'css',
  JavaScript: 'js',
};

/** Tira comentarios antes de decidir o que falta: comentario nao e codigo. */
function withoutComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/**
 * Proximo trecho de codigo que o aluno provavelmente ia escrever.
 *
 * E deliberadamente deterministico e local: nao ha chamada de rede nem modelo
 * nenhum por tras. A "inteligencia" e conhecer a fase — o que basta para o aluno
 * ver, na pratica, como uma sugestao de IDE se comporta.
 */
export function ghostSuggestion({ text, caret, file, concept }: GhostContext): GhostSuggestion | null {
  if (file !== FILE_OF[concept]) return null;

  const code = withoutComments(text);
  const pending = STEPS[concept].find((step) => !step.done(code));
  if (!pending) return null;

  // Uma linha ja comecada nao pode receber um bloco no meio dela, e o que vem
  // depois do cursor tambem nao pode acabar grudado no bloco inserido.
  const before = text.slice(0, caret);
  const after = text.slice(caret);
  const openingBreak = /\S/.test(before.slice(before.lastIndexOf('\n') + 1)) ? '\n' : '';
  const closingBreak = /^\s*\S/.test(after) && !after.startsWith('\n') ? '\n' : '';

  return { insert: `${openingBreak}${pending.block}${closingBreak}`, summary: pending.summary };
}
