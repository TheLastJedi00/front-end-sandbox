import { LevelConcept, SourceFileId } from '../core/models';

/** Codigo mostrado no slide, com o mesmo realce que ele tera na IDE. */
export interface SlideCode {
  readonly caption?: string;
  /** Linguagem do realce; sem ela, o texto aparece sem cores. */
  readonly language?: SourceFileId;
  readonly lines: readonly string[];
}

export interface SlidePoint {
  readonly label: string;
  readonly text: string;
  /** Cor de destaque do item; usa a cor do token quando ausente. */
  readonly accent?: string;
  readonly code?: string;
  /** Linguagem do realce de `code`; sem ela, o codigo aparece sem cores. */
  readonly language?: SourceFileId;
}

/** Um trecho do codigo com nome: "abertura", "seletor", "condicao"... */
export interface AnatomyPart {
  /** Linha do trecho, contando do zero. */
  readonly line: number;
  /** O trecho exatamente como esta escrito na linha. */
  readonly text: string;
  /** Qual ocorrencia de `text` na linha, quando ele se repete. Padrao: a primeira. */
  readonly occurrence?: number;
  readonly label: string;
  /** Explicacao mostrada quando e a vez desta parte. */
  readonly note: string;
}

/**
 * Codigo desmontado em partes. Cada parte e uma etapa do slide: o apresentador
 * avanca e a proxima parte acende, com o nome e a explicacao dela.
 */
export interface SlideAnatomy {
  readonly caption?: string;
  readonly language: SourceFileId;
  readonly lines: readonly string[];
  /** Na ordem em que serao explicadas — nao precisa ser a ordem do texto. */
  readonly parts: readonly AnatomyPart[];
}

/** Um elemento e o que esta dentro dele. */
export interface TreeNode {
  readonly name: string;
  readonly children?: readonly TreeNode[];
}

export interface SlideDefinition {
  readonly id: string;
  /** Rotulo pequeno acima do titulo. */
  readonly eyebrow?: string;
  readonly title: string;
  readonly lead?: string;
  /** Revelados um por etapa. */
  readonly points?: readonly SlidePoint[];
  readonly code?: SlideCode;
  /** Revelada uma parte por etapa, depois dos pontos. */
  readonly anatomy?: SlideAnatomy;
  /** Caixas aninhadas ao lado do codigo: quem esta dentro de quem. */
  readonly tree?: TreeNode;
  readonly accent?: string;
}

const HTML_ACCENT = '#e34f26';
const CSS_ACCENT = '#4aa3ff';
const JS_ACCENT = '#f0db4f';

/**
 * Abertura da apresentacao: o que e front-end e o papel de cada linguagem.
 * Tres slides, como toda sequencia: a turma quer ver algo acontecer na tela, e
 * a sintaxe fica para a sequencia que abre cada fase.
 */
export const OPENING_DECK: readonly SlideDefinition[] = [
  {
    id: 'abertura',
    eyebrow: 'sandbox-front-end',
    title: 'Você vai escrever um jogo.',
    lead: 'Com as mesmas três linguagens de toda página da internet.',
  },
  {
    id: 'tres-papeis',
    eyebrow: 'as três linguagens',
    title: 'Três linguagens, três papéis.',
    points: [
      {
        label: 'HTML',
        text: 'Cria as coisas.',
        code: '<ball></ball>',
        language: 'html',
        accent: HTML_ACCENT,
      },
      {
        label: 'CSS',
        text: 'Diz como elas aparecem.',
        code: 'ball { color: red }',
        language: 'css',
        accent: CSS_ACCENT,
      },
      {
        label: 'JavaScript',
        text: 'Faz o jogo reagir.',
        code: 'if(key("D")) { avancar() }',
        language: 'js',
        accent: JS_ACCENT,
      },
    ],
  },
  {
    id: 'como-funciona',
    eyebrow: 'o que vem agora',
    title: 'Uma fase por linguagem.',
    lead: 'Você escreve à esquerda, o jogo responde à direita.',
    points: [
      { label: 'antes', text: 'Três slides com a sintaxe.' },
      { label: 'durante', text: 'Três minutos para escrever o código.' },
      { label: 'no fim', text: 'O jogo faz o que foi pedido.' },
    ],
  },
];

/** Fase 1: o que e HTML, como uma tag e escrita e quem fica dentro de quem. */
const HTML_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-html',
    eyebrow: 'fase 1 · HTML',
    title: 'HTML cria as coisas.',
    lead: 'Cada coisa na tela é um elemento, que abre e fecha.',
    accent: HTML_ACCENT,
    code: {
      caption: 'index.html',
      language: 'html',
      lines: ['<sky>', '    <ball></ball>', '</sky>'],
    },
  },
  {
    id: 'html-anatomia-tag',
    eyebrow: 'sintaxe · a tag',
    title: 'Uma tag em três partes.',
    accent: HTML_ACCENT,
    anatomy: {
      caption: 'index.html',
      language: 'html',
      lines: ['<sky><ball></ball></sky>'],
      parts: [
        {
          line: 0,
          text: '<sky>',
          label: 'abertura',
          note: 'O nome entre < e >: o céu começa aqui.',
        },
        {
          line: 0,
          text: '<ball></ball>',
          label: 'conteúdo',
          note: 'O que vem no meio fica dentro do céu.',
        },
        {
          line: 0,
          text: '</sky>',
          label: 'fechamento',
          note: 'O mesmo nome, com uma barra: o céu termina.',
        },
      ],
    },
  },
  {
    id: 'html-aninhamento',
    eyebrow: 'sintaxe · dentro de quem',
    title: 'Caixas dentro de caixas.',
    lead: 'A bola e o chão ficam dentro do céu.',
    accent: HTML_ACCENT,
    code: {
      caption: 'index.html',
      language: 'html',
      lines: ['<sky>', '    <ball></ball>', '    <ground></ground>', '</sky>'],
    },
    tree: { name: 'sky', children: [{ name: 'ball' }, { name: 'ground' }] },
  },
];

/** Fase 2: o que e CSS, como uma regra e escrita e como a animacao funciona. */
const CSS_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-css',
    eyebrow: 'fase 2 · CSS',
    title: 'CSS diz como as coisas aparecem.',
    lead: 'O seletor ball encontra a tag <ball> pelo nome e muda só ela.',
    accent: CSS_ACCENT,
    code: {
      caption: 'style.css',
      language: 'css',
      lines: ['ball {', '    color: red;', '}'],
    },
  },
  {
    id: 'css-anatomia-regra',
    eyebrow: 'sintaxe · a regra',
    title: 'Uma regra em três partes.',
    accent: CSS_ACCENT,
    anatomy: {
      caption: 'style.css',
      language: 'css',
      lines: ['ball {', '    color: red;', '}'],
      parts: [
        {
          line: 0,
          text: 'ball {',
          label: 'seletor',
          note: 'Qual elemento muda. O bloco abre com a chave.',
        },
        {
          line: 1,
          text: 'color:',
          label: 'propriedade',
          note: 'O que muda nele, seguido de dois-pontos.',
        },
        {
          line: 1,
          text: 'red;',
          label: 'valor',
          note: 'Como fica. O ponto e vírgula fecha a linha.',
        },
      ],
    },
  },
  {
    id: 'css-animacao',
    eyebrow: 'sintaxe · a animação',
    title: 'Criar a animação e aplicar.',
    accent: CSS_ACCENT,
    anatomy: {
      caption: 'style.css',
      language: 'css',
      lines: [
        '@animation jump {',
        '    inicio { position: 0 }',
        '    meio { position: 1 }',
        '    fim { position: 0 }',
        '}',
        'ball { animation: jump }',
      ],
      parts: [
        {
          line: 0,
          text: '@animation jump',
          label: 'cria',
          note: 'Uma animação nova, chamada jump.',
        },
        {
          line: 2,
          text: 'meio { position: 1 }',
          label: 'momentos',
          note: 'A altura em cada momento: no meio, lá em cima.',
        },
        {
          line: 5,
          text: 'animation: jump',
          label: 'aplica',
          note: 'Sem esta linha, a bola não pula.',
        },
      ],
    },
  },
];

/** Fase 3: o que e JavaScript, como uma condicao e escrita e uma tecla por if. */
const JS_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-js',
    eyebrow: 'fase 3 · JavaScript',
    title: 'JavaScript reage ao jogador.',
    lead: 'Ele pergunta o tempo todo: a tecla está apertada?',
    accent: JS_ACCENT,
    code: {
      caption: 'script.js',
      language: 'js',
      lines: ['if(key("D")){', '    avancar()', '}'],
    },
    points: [
      {
        label: 'sim',
        text: 'Tecla apertada: a bola avança.',
        accent: 'var(--state-success)',
      },
      {
        label: 'não',
        text: 'Tecla solta: nada acontece.',
        accent: 'var(--state-error)',
      },
    ],
  },
  {
    id: 'js-anatomia-if',
    eyebrow: 'sintaxe · a condição',
    title: 'Um if em três partes.',
    accent: JS_ACCENT,
    anatomy: {
      caption: 'script.js',
      language: 'js',
      lines: ['if(key("D")){', '    avancar()', '}'],
      parts: [
        {
          line: 0,
          text: 'if',
          label: 'se',
          note: 'if quer dizer "se": começa uma decisão.',
        },
        {
          line: 0,
          text: 'key("D")',
          label: 'condição',
          note: 'A pergunta, entre parênteses: a tecla D está apertada?',
        },
        {
          line: 1,
          text: 'avancar()',
          label: 'ação',
          note: 'O que acontece se for sim, entre as chaves.',
        },
      ],
    },
  },
  {
    id: 'js-varios-if',
    eyebrow: 'sintaxe · várias perguntas',
    title: 'Cada tecla, um if.',
    lead: 'Um não espera o outro: D e espaço juntos, a bola anda e pula.',
    accent: JS_ACCENT,
    code: {
      caption: 'script.js',
      language: 'js',
      lines: [
        'if(key("D")){ avancar() }',
        'if(key("A")){ recuar() }',
        'if(key("space")){ element("ball").animation("jump") }',
      ],
    },
  },
];

/**
 * Sequencia que abre cada fase: o conceito primeiro e, depois dele, a sintaxe
 * desmontada. Serve para dar o vocabulario antes de a mao ir para o teclado.
 */
export const CONCEPT_SLIDES: Readonly<Record<LevelConcept, readonly SlideDefinition[]>> = {
  HTML: HTML_SEQUENCE,
  CSS: CSS_SEQUENCE,
  JavaScript: JS_SEQUENCE,
};

export function conceptSlides(concept: LevelConcept): readonly SlideDefinition[] {
  return CONCEPT_SLIDES[concept];
}
