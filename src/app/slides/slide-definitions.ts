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

/** Fase 1: o que e HTML e como uma tag e escrita. */
const HTML_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-html',
    eyebrow: 'fase 1 · HTML',
    title: 'HTML cria as coisas.',
    lead:
      'Cada coisa na tela é um elemento, e todo elemento se abre e se fecha. O que está escrito entre a abertura e o fechamento fica dentro dele.',
    accent: HTML_ACCENT,
    code: {
      caption: 'index.html',
      language: 'html',
      lines: ['<sky>', '    <ball></ball>', '</sky>', '', '<!-- a bola está dentro do céu -->'],
    },
  },
];

/** Fase 2: o que e CSS, como uma regra e escrita e como a animacao funciona. */
const CSS_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-css',
    eyebrow: 'fase 2 · CSS',
    title: 'CSS diz como as coisas aparecem.',
    lead:
      'Um bloco de CSS escolhe um elemento e lista o que muda nele. Uma animação é a mesma ideia esticada no tempo: o que é no início, no meio e no fim.',
    accent: CSS_ACCENT,
    code: {
      caption: 'style.css',
      language: 'css',
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
];

/** Fase 3: o que e JavaScript e como uma condicao e escrita. */
const JS_SEQUENCE: readonly SlideDefinition[] = [
  {
    id: 'conceito-js',
    eyebrow: 'fase 3 · JavaScript',
    title: 'JavaScript reage ao jogador.',
    lead:
      'Aqui o código não descreve, ele decide. "Se a tecla D estiver apertada, avance" — e isso é verificado muitas vezes por segundo, enquanto o jogo roda.',
    accent: JS_ACCENT,
    code: {
      caption: 'script.js',
      language: 'js',
      lines: ['if(key("D")){', '    avancar()', '}'],
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
