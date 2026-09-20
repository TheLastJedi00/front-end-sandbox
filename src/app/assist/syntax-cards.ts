import { LevelConcept } from '../core/models';

export interface SyntaxCard {
  readonly id: string;
  readonly title: string;
  /** O que a sintaxe faz, em uma frase. */
  readonly explanation: string;
  /** Exemplo minimo, ja no formato que a fase aceita. */
  readonly example: readonly string[];
  /** O erro que aparece toda vez nessa fase. */
  readonly mistake: string;
}

/**
 * Cards mostrados quando a fase abre, antes de a primeira tecla ser digitada.
 * Sao um lembrete de sintaxe, nao um tutorial: tres cards no maximo, porque o
 * quarto ninguem le.
 */
export const SYNTAX_CARDS: Readonly<Record<LevelConcept, readonly SyntaxCard[]>> = {
  HTML: [
    {
      id: 'html-elemento',
      title: 'Um elemento abre e fecha',
      explanation: 'O nome entre < e > abre o elemento; o mesmo nome com / fecha.',
      example: ['<ball></ball>'],
      mistake: 'Esquecer a barra no fechamento: <ball><ball>.',
    },
    {
      id: 'html-aninhamento',
      title: 'Quem está dentro de quem',
      explanation: 'O que você escreve entre a abertura e o fechamento fica dentro do elemento.',
      example: ['<sky>', '    <ball></ball>', '</sky>'],
      mistake: 'Escrever a bola depois de </sky> — aí ela fica fora do céu.',
    },
    {
      id: 'html-comentario',
      title: 'Comentário não é código',
      explanation: 'O que está entre <!-- e --> é recado para gente, o navegador ignora.',
      example: ['<!-- o céu vem primeiro -->'],
      mistake: 'Achar que o comentário cria alguma coisa na tela.',
    },
  ],
  CSS: [
    {
      id: 'css-bloco',
      title: 'Seletor e propriedades',
      explanation: 'Escolha o elemento e liste o que muda nele, entre chaves.',
      example: ['ball {', '    color: red;', '}'],
      mistake: 'Esquecer os dois-pontos entre a propriedade e o valor.',
    },
    {
      id: 'css-animacao',
      title: 'A animação tem três momentos',
      explanation: 'inicio, meio e fim descrevem a altura da bola: position 0 é o chão, 1 é o alto.',
      example: ['@animation jump {', '    inicio { position: 0 }', '    meio { position: 1 }', '    fim { position: 0 }', '}'],
      mistake: 'Criar a animação e esquecer de aplicá-la.',
    },
    {
      id: 'css-aplicar',
      title: 'Aplicar a animação',
      explanation: 'Uma animação só acontece quando um elemento diz que a usa.',
      example: ['ball {', '    animation: jump', '}'],
      mistake: 'Aplicar um nome diferente do que foi declarado no @animation.',
    },
  ],
  JavaScript: [
    {
      id: 'js-if',
      title: 'Se isso, então aquilo',
      explanation: 'O if testa uma condição; o que está entre as chaves só acontece se ela for verdadeira.',
      example: ['if(key("D")){', '    avancar()', '}'],
      mistake: 'Escrever a condição sem os parênteses do if.',
    },
    {
      id: 'js-teclas',
      title: 'As teclas do jogo',
      explanation: 'key("D") e key("A") andam; key("space") é o pulo.',
      example: ['key("A")', 'key("D")', 'key("space")'],
      mistake: 'Usar o nome da tecla sem as aspas.',
    },
    {
      id: 'js-acao',
      title: 'Chamar uma ação',
      explanation: 'Um comando só executa com os parênteses no fim — é isso que o "chama".',
      example: ['avancar()', 'recuar()', 'element("ball").animation("jump")'],
      mistake: 'Escrever avancar sem os parênteses: nada acontece.',
    },
  ],
};

export function syntaxCards(concept: LevelConcept): readonly SyntaxCard[] {
  return SYNTAX_CARDS[concept];
}
