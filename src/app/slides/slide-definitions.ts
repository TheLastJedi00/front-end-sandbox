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
  {
    id: 'js-anatomia-if',
    eyebrow: 'sintaxe · a condição',
    title: 'Um if, peça por peça.',
    lead: 'O if é uma pergunta com uma ação: “se isto for verdade, faça aquilo”.',
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
          note: 'if quer dizer “se”. É a palavra que começa uma decisão.',
        },
        {
          line: 0,
          text: '(',
          label: 'abre a pergunta',
          note: 'A pergunta fica entre parênteses, logo depois do if.',
        },
        {
          line: 0,
          text: 'key("D")',
          label: 'condição',
          note: 'A pergunta em si: a tecla D está apertada agora? A resposta é sim ou não.',
        },
        {
          line: 0,
          text: ')',
          occurrence: 1,
          label: 'fecha a pergunta',
          note: 'Este parêntese fecha a pergunta do if. O outro, antes dele, fecha o key("D").',
        },
        {
          line: 0,
          text: '{',
          label: 'então',
          note: 'A chave abre o que acontece quando a resposta for sim.',
        },
        {
          line: 1,
          text: 'avancar()',
          label: 'ação',
          note: 'O que o jogo faz se a pergunta der sim: a bola anda para a direita.',
        },
        {
          line: 2,
          text: '}',
          label: 'fim do se',
          note: 'Aqui termina o que depende da pergunta.',
        },
      ],
    },
  },
  {
    id: 'js-verdadeiro-falso',
    eyebrow: 'sintaxe · sim ou não',
    title: 'A condição só tem duas respostas.',
    lead: 'Toda condição vira verdadeiro ou falso — e é isso que decide se o bloco roda.',
    accent: JS_ACCENT,
    points: [
      {
        label: 'verdadeiro',
        text: 'Com a tecla D apertada, o que está entre as chaves acontece: a bola avança.',
        code: 'key("D") → verdadeiro',
        language: 'js',
        accent: 'var(--state-success)',
      },
      {
        label: 'falso',
        text: 'Com a tecla solta, o bloco é pulado. Nada acontece, e está tudo certo.',
        code: 'key("D") → falso',
        language: 'js',
        accent: 'var(--state-error)',
      },
      {
        label: 'o tempo todo',
        text: 'O jogo faz essa pergunta dezenas de vezes por segundo, enquanto roda.',
      },
    ],
  },
  {
    id: 'js-varios-if',
    eyebrow: 'sintaxe · várias perguntas',
    title: 'Cada tecla, um if.',
    lead:
      'Os ifs são independentes: um não espera o outro. Apertando D e espaço juntos, a bola anda e pula ao mesmo tempo.',
    accent: JS_ACCENT,
    code: {
      caption: 'script.js',
      language: 'js',
      lines: [
        'if(key("D")){',
        '    avancar()',
        '}',
        'if(key("A")){',
        '    recuar()',
        '}',
        'if(key("space")){',
        '    element("ball").animation("jump")',
        '}',
      ],
    },
  },
  {
    id: 'js-anatomia-acao',
    eyebrow: 'sintaxe · a ação',
    title: 'Chamar uma ação.',
    lead: 'Dentro do if vai o que o jogo deve fazer. Uma ação sempre termina com parênteses.',
    accent: JS_ACCENT,
    anatomy: {
      caption: 'script.js',
      language: 'js',
      lines: ['avancar()', 'element("ball").animation("jump")'],
      parts: [
        {
          line: 0,
          text: 'avancar',
          label: 'nome da ação',
          note: 'O que fazer. No jogo existem avancar, recuar e element.',
        },
        {
          line: 0,
          text: '()',
          label: 'faça agora',
          note: 'Os parênteses mandam executar. Sem eles, o nome só é lembrado e nada acontece.',
        },
        {
          line: 1,
          text: 'element("ball")',
          label: 'pega o elemento',
          note: 'Busca a bola que você criou no HTML, pelo nome da tag.',
        },
        {
          line: 1,
          text: '.',
          label: 'dele',
          note: 'O ponto quer dizer “desta bola”: a próxima ação é feita nela.',
        },
        {
          line: 1,
          text: 'animation("jump")',
          label: 'dispara a animação',
          note: 'Roda a animação jump que você declarou no CSS. As três linguagens se encontram aqui.',
        },
      ],
    },
  },
  {
    id: 'js-erros',
    eyebrow: 'sintaxe · cuidado',
    title: 'Três jeitos de errar no JavaScript.',
    lead: 'Se a bola não responder à tecla, confira estes primeiro.',
    accent: JS_ACCENT,
    points: [
      {
        label: 'tecla sem aspas',
        text: 'O nome da tecla é um texto: vai entre aspas.',
        code: 'if(key(D)){',
        language: 'js',
      },
      {
        label: 'ação sem parênteses',
        text: 'Sem os parênteses, a ação não é executada.',
        code: 'avancar',
        language: 'js',
      },
      {
        label: 'chave esquecida',
        text: 'Toda chave que abre precisa fechar, senão o resto do código entra no if.',
        code: 'if(key("A")){ recuar()',
        language: 'js',
      },
    ],
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
