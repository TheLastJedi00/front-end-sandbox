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
  {
    id: 'html-anatomia-tag',
    eyebrow: 'sintaxe · a tag',
    title: 'Uma tag, peça por peça.',
    lead: 'Todo elemento do HTML é escrito do mesmo jeito. Avance para ver cada parte.',
    accent: HTML_ACCENT,
    anatomy: {
      caption: 'index.html',
      language: 'html',
      lines: ['<ball></ball>'],
      parts: [
        {
          line: 0,
          text: '<',
          label: 'começa a tag',
          note: 'O sinal de menor avisa o navegador: o que vem agora é o nome de um elemento.',
        },
        {
          line: 0,
          text: 'ball',
          label: 'nome',
          note: 'O nome diz qual elemento é. No nosso jogo existem três: sky, ball e ground.',
        },
        {
          line: 0,
          text: '>',
          label: 'termina a tag',
          note: 'O sinal de maior fecha o nome. Juntos, <ball> é a abertura: a bola começa aqui.',
        },
        {
          line: 0,
          text: '</ball>',
          label: 'fechamento',
          note: 'O mesmo nome, com uma barra depois do <. Aqui a bola termina.',
        },
      ],
    },
  },
  {
    id: 'html-vazio-conteudo',
    eyebrow: 'sintaxe · o que vai no meio',
    title: 'Entre a abertura e o fechamento.',
    lead: 'O espaço entre <ball> e </ball> é o lado de dentro do elemento.',
    accent: HTML_ACCENT,
    points: [
      {
        label: 'vazio',
        text: 'Nada no meio: a bola existe, mas não tem nada dentro dela.',
        code: '<ball></ball>',
      },
      {
        label: 'com conteúdo',
        text: 'A bola escrita no meio do céu fica dentro do céu.',
        code: '<sky><ball></ball></sky>',
      },
    ],
  },
  {
    id: 'html-aninhamento',
    eyebrow: 'sintaxe · dentro de quem',
    title: 'O código vira caixas dentro de caixas.',
    lead:
      'Os espaços no começo da linha não mudam nada para o navegador — eles só ajudam a gente a ver quem está dentro de quem.',
    accent: HTML_ACCENT,
    code: {
      caption: 'index.html',
      language: 'html',
      lines: ['<sky>', '    <ball></ball>', '    <ground></ground>', '</sky>'],
    },
    tree: { name: 'sky', children: [{ name: 'ball' }, { name: 'ground' }] },
  },
  {
    id: 'html-erros',
    eyebrow: 'sintaxe · cuidado',
    title: 'Três jeitos de errar uma tag.',
    lead: 'Se o painel de problemas reclamar, quase sempre é um destes.',
    accent: HTML_ACCENT,
    points: [
      {
        label: 'esqueceu a barra',
        text: 'Sem a barra, o navegador acha que é outra bola abrindo.',
        code: '<ball><ball>',
      },
      {
        label: 'fechou fora',
        text: 'Escrita depois de </sky>, a bola fica fora do céu.',
        code: '<sky></sky><ball></ball>',
      },
      {
        label: 'nome inventado',
        text: 'Só existem sky, ball e ground. Outro nome não vira nada.',
        code: '<star></star>',
      },
    ],
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
      lines: ['ball {', '    color: red;', '}'],
    },
  },
  {
    id: 'css-anatomia-regra',
    eyebrow: 'sintaxe · a regra',
    title: 'Uma regra de CSS, peça por peça.',
    lead: 'Toda regra de CSS tem o mesmo formato. Avance para ver cada parte.',
    accent: CSS_ACCENT,
    anatomy: {
      caption: 'style.css',
      language: 'css',
      lines: ['ball {', '    color: red;', '}'],
      parts: [
        {
          line: 0,
          text: 'ball',
          label: 'seletor',
          note: 'Escolhe qual elemento vai mudar. É o nome da tag do HTML, sem os sinais < e >.',
        },
        {
          line: 0,
          text: '{',
          label: 'abre o bloco',
          note: 'Tudo o que muda na bola fica entre as chaves.',
        },
        {
          line: 1,
          text: 'color',
          label: 'propriedade',
          note: 'O que vai mudar. Aqui, a cor.',
        },
        {
          line: 1,
          text: ':',
          label: 'dois-pontos',
          note: 'Separa o que muda do jeito que vai ficar.',
        },
        {
          line: 1,
          text: 'red',
          label: 'valor',
          note: 'Como vai ficar: vermelho.',
        },
        {
          line: 1,
          text: ';',
          label: 'ponto e vírgula',
          note: 'Termina a linha. Embaixo dela cabe outra propriedade.',
        },
        {
          line: 2,
          text: '}',
          label: 'fecha o bloco',
          note: 'Acabou o que muda na bola.',
        },
      ],
    },
  },
  {
    id: 'css-seletor-tag',
    eyebrow: 'sintaxe · seletor e tag',
    title: 'O seletor aponta para a tag.',
    lead: 'O CSS não cria nada: ele procura no HTML o elemento com aquele nome e muda só ele.',
    accent: CSS_ACCENT,
    points: [
      {
        label: 'no HTML',
        text: 'A bola foi criada na fase 1.',
        code: '<ball></ball>',
        accent: HTML_ACCENT,
      },
      {
        label: 'no CSS',
        text: 'O seletor ball encontra a bola pelo nome.',
        code: 'ball { color: red; }',
        accent: CSS_ACCENT,
      },
      {
        label: 'na tela',
        text: 'A bola fica vermelha — e o céu e o terreno continuam como estavam.',
        accent: 'var(--game-red)',
      },
    ],
  },
  {
    id: 'css-tres-blocos',
    eyebrow: 'sintaxe · um bloco por elemento',
    title: 'Cada elemento ganha o seu bloco.',
    lead: 'Três elementos no HTML, três regras no CSS. A ordem dos blocos não importa.',
    accent: CSS_ACCENT,
    code: {
      caption: 'style.css',
      language: 'css',
      lines: [
        'sky {',
        '    color: blue;',
        '}',
        'ball {',
        '    color: red;',
        '}',
        'ground {',
        '    color: green;',
        '}',
      ],
    },
    tree: { name: 'sky', children: [{ name: 'ball' }, { name: 'ground' }] },
  },
  {
    id: 'css-anatomia-animacao',
    eyebrow: 'sintaxe · a animação',
    title: 'Uma animação é uma regra no tempo.',
    lead: 'Em vez de dizer como a bola é, você diz como ela está em cada momento do pulo.',
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
      ],
      parts: [
        {
          line: 0,
          text: '@animation',
          label: 'declara',
          note: 'O @ avisa que isto não é um elemento: é uma animação sendo criada.',
        },
        {
          line: 0,
          text: 'jump',
          label: 'nome',
          note: 'O nome que você escolheu. É por ele que a animação vai ser chamada depois.',
        },
        {
          line: 1,
          text: 'inicio',
          label: 'momento',
          note: 'Três momentos: inicio, meio e fim. Cada um tem o seu bloco.',
        },
        {
          line: 2,
          text: 'position: 1',
          label: 'altura',
          note: 'position 0 é o chão; 1 é o ponto mais alto. No meio do pulo, a bola está lá em cima.',
        },
        {
          line: 3,
          text: 'position: 0',
          label: 'de volta',
          note: 'No fim, a bola volta para o chão — e o pulo está completo.',
        },
      ],
    },
  },
  {
    id: 'css-aplicar-animacao',
    eyebrow: 'sintaxe · aplicar',
    title: 'Criar a animação não basta: é preciso aplicá-la.',
    lead: 'A animação fica guardada até algum elemento usá-la pelo nome.',
    accent: CSS_ACCENT,
    anatomy: {
      caption: 'style.css',
      language: 'css',
      lines: ['ball {', '    color: red;', '    animation: jump', '}'],
      parts: [
        {
          line: 2,
          text: 'animation',
          label: 'propriedade',
          note: 'Uma propriedade como a cor — só que o valor dela é uma animação.',
        },
        {
          line: 2,
          text: 'jump',
          label: 'o nome',
          note: 'O mesmo nome escrito depois de @animation. Se estiver diferente, nada pula.',
        },
      ],
    },
  },
  {
    id: 'css-erros',
    eyebrow: 'sintaxe · cuidado',
    title: 'Três jeitos de errar no CSS.',
    lead: 'Se a cor não aparecer ou a bola não pular, confira estes primeiro.',
    accent: CSS_ACCENT,
    points: [
      {
        label: 'sem dois-pontos',
        text: 'Sem os dois-pontos, o navegador não sabe onde acaba a propriedade.',
        code: 'color red;',
      },
      {
        label: 'seletor com sinais',
        text: 'No CSS o seletor é só o nome, sem < e >.',
        code: '<ball> { color: red; }',
      },
      {
        label: 'nome trocado',
        text: 'A animação se chama jump; aplicar outro nome não faz nada.',
        code: 'animation: pulo',
      },
    ],
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
        accent: 'var(--state-success)',
      },
      {
        label: 'falso',
        text: 'Com a tecla solta, o bloco é pulado. Nada acontece, e está tudo certo.',
        code: 'key("D") → falso',
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
      },
      {
        label: 'ação sem parênteses',
        text: 'Sem os parênteses, a ação não é executada.',
        code: 'avancar',
      },
      {
        label: 'chave esquecida',
        text: 'Toda chave que abre precisa fechar, senão o resto do código entra no if.',
        code: 'if(key("A")){ recuar()',
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
