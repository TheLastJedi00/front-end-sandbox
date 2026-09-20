import { LevelDefinition } from '../core/models';

const FASE1_HTML = `<sky>
    <ball></ball>
    <ground></ground>
</sky>`;

const FASE2_CSS = `sky {
    color: blue;
}
ball {
    color: red;
    animation: jump
}
ground {
    color: green;
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
}`;

const FASE3_JS = `if(key("D")){
    avancar()
}
if(key("A")){
    recuar()
}
if(key("space")){
    element("ball").animation("jump")
}`;

/**
 * Uma fase, uma ferramenta: o aluno termina a fase 1 sabendo o que o HTML faz,
 * a fase 2 sabendo o que o CSS faz e a fase 3 sabendo o que o JavaScript faz.
 */
export const LEVELS: readonly LevelDefinition[] = [
  {
    id: 1,
    concept: 'HTML',
    title: 'O que existe na tela',
    goal: 'Coloque a bola e o terreno dentro do céu.',
    briefing:
      'O HTML diz quais coisas existem e quem está dentro de quem. Cada elemento se escreve abrindo e fechando: <ball></ball>. Crie a bola e o terreno dentro de <sky> — eles vão aparecer em cinza, porque a cor é assunto da próxima fase.',
    enabledFiles: ['html'],
    focusFile: 'html',
    starter: {
      html: `<!-- Tudo que existe no jogo fica dentro do céu -->
<sky>

</sky>`,
      css: '',
      js: '',
    },
    solution: { html: FASE1_HTML, css: '', js: '' },
    interactive: false,
    checks: [
      { id: 'sky-exists', label: 'O céu existe' },
      { id: 'ball-inside-sky', label: 'A bola está dentro do céu' },
      { id: 'ground-inside-sky', label: 'O terreno está dentro do céu' },
    ],
    hints: [
      'Um elemento se escreve abrindo e fechando: <ball></ball>.',
      'Para ficar dentro do céu, escreva <ball></ball> entre <sky> e </sky>.',
      'Falta o terreno: <ground></ground>, também dentro do céu.',
    ],
  },
  {
    id: 2,
    concept: 'CSS',
    title: 'Pintar e fazer pular',
    goal: 'Dê uma cor a cada elemento e crie a animação do pulo.',
    briefing:
      'O CSS diz como as coisas aparecem. Um bloco tem um seletor e as suas propriedades: sky { color: blue }. Depois de pintar os três elementos, descreva o pulo numa animação com três momentos — início, meio e fim, onde position 0 é o chão e 1 é o alto — e aplique-a na bola.',
    enabledFiles: ['html', 'css'],
    focusFile: 'css',
    starter: {
      html: FASE1_HTML,
      css: `/* Escolha a cor de cada elemento */


/* Depois crie aqui a animação do pulo */
`,
      js: '',
    },
    solution: { html: FASE1_HTML, css: FASE2_CSS, js: '' },
    interactive: false,
    checks: [
      { id: 'sky-blue', label: 'O céu é azul (blue)' },
      { id: 'ball-red', label: 'A bola é vermelha (red)' },
      { id: 'ground-green', label: 'O terreno é verde (green)' },
      { id: 'animation-declared', label: 'A animação jump tem início, meio e fim' },
      { id: 'animation-applied', label: 'A bola usa a animação jump' },
      { id: 'ball-jumped', label: 'A bola pula no resultado' },
    ],
    hints: [
      'Para pintar o céu: sky { color: blue }.',
      'A animação começa com @animation jump { ... }.',
      'Cada momento tem a sua altura: inicio { position: 0 }.',
      'Para usar a animação, escreva animation: jump dentro de ball { ... }.',
    ],
  },
  {
    id: 3,
    concept: 'JavaScript',
    title: 'Dar o controle ao jogador',
    goal: 'Use o teclado para andar e pular até a bandeira.',
    briefing:
      'O JavaScript decide o que acontece quando algo ocorre — aqui, quando uma tecla é pressionada. Clique no palco para que ele escute o teclado e leve a bola até a bandeira. Só dá para alcançá-la pulando.',
    enabledFiles: ['html', 'css', 'js'],
    focusFile: 'js',
    starter: {
      html: FASE1_HTML,
      css: FASE2_CSS,
      js: `// O que acontece quando o jogador aperta uma tecla?
`,
    },
    solution: { html: FASE1_HTML, css: FASE2_CSS, js: FASE3_JS },
    interactive: true,
    checks: [
      { id: 'move-forward', label: 'A tecla D faz a bola avançar' },
      { id: 'move-backward', label: 'A tecla A faz a bola recuar' },
      { id: 'jump-on-space', label: 'O espaço faz a bola pular' },
      { id: 'goal-reached', label: 'A bola alcançou a bandeira' },
    ],
    hints: [
      'A condição se escreve assim: if(key("D")) { avancar() }.',
      'Para recuar, o comando é recuar().',
      'Para pular: element("ball").animation("jump").',
      'Clique no palco antes de usar o teclado.',
    ],
  },
];

export const FIRST_LEVEL = LEVELS[0].id;
export const LAST_LEVEL = LEVELS[LEVELS.length - 1].id;

export function findLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}
