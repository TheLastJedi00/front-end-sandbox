import { LevelConcept } from '../core/models';

/** Uma linha de codigo mostrada no slide, com a cor do papel que ela cumpre. */
export interface SlideCode {
  readonly caption?: string;
  readonly lines: readonly string[];
}

export interface SlidePoint {
  readonly label: string;
  readonly text: string;
  /** Cor de destaque do item; usa a cor do token quando ausente. */
  readonly accent?: string;
  readonly code?: string;
}

export interface SlideDefinition {
  readonly id: string;
  /** Rotulo pequeno acima do titulo. */
  readonly eyebrow?: string;
  readonly title: string;
  readonly lead?: string;
  readonly points?: readonly SlidePoint[];
  readonly code?: SlideCode;
  readonly accent?: string;
}

const HTML_ACCENT = '#e34f26';
const CSS_ACCENT = '#4aa3ff';
const JS_ACCENT = '#f0db4f';

/**
 * Abertura da apresentacao. Quatro slides e o limite do que cabe antes de a
 * turma querer ver algo acontecer na tela.
 */
export const OPENING_DECK: readonly SlideDefinition[] = [
  {
    id: 'abertura',
    eyebrow: 'sandbox-front-end',
    title: 'Você vai escrever um jogo.',
    lead:
      'Não jogar um jogo pronto: escrever o código dele. As mesmas três linguagens que fazem toda página da internet funcionar.',
  },
  {
    id: 'tres-papeis',
    eyebrow: 'as três linguagens',
    title: 'Cada uma tem um papel.',
    points: [
      {
        label: 'HTML',
        text: 'Cria as coisas e diz quem fica dentro de quem.',
        code: '<ball></ball>',
        accent: HTML_ACCENT,
      },
      {
        label: 'CSS',
        text: 'Dá cor, tamanho e movimento ao que já existe.',
        code: 'ball { color: red }',
        accent: CSS_ACCENT,
      },
      {
        label: 'JavaScript',
        text: 'Reage ao jogador e muda o jogo enquanto ele roda.',
        code: 'if(key("D")) { avancar() }',
        accent: JS_ACCENT,
      },
    ],
  },
  {
    id: 'como-se-juntam',
    eyebrow: 'como elas se juntam',
    title: 'O navegador lê as três ao mesmo tempo.',
    lead:
      'Você escreve os três arquivos separados. O navegador junta tudo: pega a estrutura do HTML, pinta com o CSS e deixa o JavaScript escutando o que o jogador faz.',
    code: {
      caption: 'três arquivos, uma tela',
      lines: ['index.html   →   o que existe', 'style.css    →   como aparece', 'script.js    →   o que acontece'],
    },
  },
  {
    id: 'como-funciona',
    eyebrow: 'o que vem agora',
    title: 'Você escreve à esquerda, o jogo responde à direita.',
    lead:
      'São três fases, uma por linguagem. A cada letra digitada o resultado é redesenhado ao lado — e a fase só termina quando o jogo faz o que foi pedido.',
  },
];

/**
 * Slide que abre cada fase. Fica curto de proposito: ele serve para dar o
 * vocabulario antes de a mao ir para o teclado, nao para dar aula.
 */
export const CONCEPT_SLIDES: Readonly<Record<LevelConcept, SlideDefinition>> = {
  HTML: {
    id: 'conceito-html',
    eyebrow: 'fase 1 · HTML',
    title: 'HTML cria as coisas.',
    lead:
      'Cada coisa na tela é um elemento, e todo elemento se abre e se fecha. O que está escrito entre a abertura e o fechamento fica dentro dele.',
    accent: HTML_ACCENT,
    code: {
      caption: 'index.html',
      lines: ['<sky>', '    <ball></ball>', '</sky>', '', '<!-- a bola está dentro do céu -->'],
    },
  },
  CSS: {
    id: 'conceito-css',
    eyebrow: 'fase 2 · CSS',
    title: 'CSS diz como as coisas aparecem.',
    lead:
      'Um bloco de CSS escolhe um elemento e lista o que muda nele. Uma animação é a mesma ideia esticada no tempo: o que é no início, no meio e no fim.',
    accent: CSS_ACCENT,
    code: {
      caption: 'style.css',
      lines: [
        'ball {',
        '    color: red;',
        '}',
        '',
        '@animation jump {',
        '    inicio { position: 0 }',
        '    meio   { position: 1 }',
        '    fim    { position: 0 }',
        '}',
      ],
    },
  },
  JavaScript: {
    id: 'conceito-js',
    eyebrow: 'fase 3 · JavaScript',
    title: 'JavaScript reage ao jogador.',
    lead:
      'Aqui o código não descreve, ele decide. "Se a tecla D estiver apertada, avance" — e isso é verificado muitas vezes por segundo, enquanto o jogo roda.',
    accent: JS_ACCENT,
    code: {
      caption: 'script.js',
      lines: ['if(key("D")){', '    avancar()', '}'],
    },
  },
};

export function conceptSlide(concept: LevelConcept): SlideDefinition {
  return CONCEPT_SLIDES[concept];
}
