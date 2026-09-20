import { SourceFileId } from '../core/models';

export type CompletionKind =
  | 'tag'
  | 'selector'
  | 'property'
  | 'value'
  | 'step'
  | 'atrule'
  | 'function'
  | 'keyword';

export interface VocabularyEntry {
  /** O que o aluno ve na lista e o que e comparado com o que ele digitou. */
  readonly label: string;
  /** Texto inserido no lugar da palavra em digitacao. */
  readonly insert: string;
  /** Uma linha explicando para que serve. */
  readonly detail: string;
  readonly kind: CompletionKind;
  /** Onde o cursor para depois de inserir, contado do inicio de `insert`. */
  readonly caretOffset?: number;
}

const TAGS: readonly VocabularyEntry[] = [
  { label: 'sky', insert: 'sky', detail: 'O céu: tudo no jogo fica dentro dele.', kind: 'tag' },
  { label: 'ball', insert: 'ball', detail: 'A bola, o personagem do jogo.', kind: 'tag' },
  { label: 'ground', insert: 'ground', detail: 'O terreno onde a bola pisa.', kind: 'tag' },
];

const CSS_ENTRIES: readonly VocabularyEntry[] = [
  ...TAGS.map((tag): VocabularyEntry => ({ ...tag, kind: 'selector', detail: `Estilo de <${tag.label}>.` })),
  { label: 'color', insert: 'color: ', detail: 'A cor do elemento.', kind: 'property' },
  { label: 'animation', insert: 'animation: ', detail: 'Aplica uma animação já declarada.', kind: 'property' },
  { label: 'position', insert: 'position: ', detail: 'Altura no momento da animação: 0 é o chão, 1 é o alto.', kind: 'property' },
  { label: 'blue', insert: 'blue', detail: 'Azul — a cor do céu no enunciado.', kind: 'value' },
  { label: 'red', insert: 'red', detail: 'Vermelho — a cor da bola no enunciado.', kind: 'value' },
  { label: 'green', insert: 'green', detail: 'Verde — a cor do terreno no enunciado.', kind: 'value' },
  { label: 'jump', insert: 'jump', detail: 'O nome da animação do pulo.', kind: 'value' },
  {
    label: '@animation',
    insert: '@animation jump {\n    inicio { position: 0 }\n    meio { position: 1 }\n    fim { position: 0 }\n}',
    detail: 'Declara uma animação com os seus três momentos.',
    kind: 'atrule',
  },
  { label: 'inicio', insert: 'inicio { position: 0 }', detail: 'Primeiro momento da animação.', kind: 'step' },
  { label: 'meio', insert: 'meio { position: 1 }', detail: 'Momento do meio: o alto do pulo.', kind: 'step' },
  { label: 'fim', insert: 'fim { position: 0 }', detail: 'Último momento: de volta ao chão.', kind: 'step' },
];

const JS_ENTRIES: readonly VocabularyEntry[] = [
  {
    label: 'if',
    insert: 'if(key("D")){\n    avancar()\n}',
    detail: 'Só acontece quando a condição é verdadeira.',
    kind: 'keyword',
  },
  { label: 'key', insert: 'key("D")', detail: 'Verdadeiro enquanto a tecla estiver apertada.', kind: 'function' },
  { label: 'avancar', insert: 'avancar()', detail: 'Move a bola para a direita.', kind: 'function' },
  { label: 'recuar', insert: 'recuar()', detail: 'Move a bola para a esquerda.', kind: 'function' },
  {
    label: 'element',
    insert: 'element("ball").animation("jump")',
    detail: 'Pega um elemento e dispara a animação dele.',
    kind: 'function',
  },
];

/**
 * Vocabulario permitido por arquivo. A lista e fechada de proposito: sugerir
 * qualquer coisa que o HTML real aceita so daria erro no parser da fase.
 */
export const VOCABULARY: Readonly<Record<SourceFileId, readonly VocabularyEntry[]>> = {
  html: TAGS,
  css: CSS_ENTRIES,
  js: JS_ENTRIES,
};

export function vocabularyFor(file: SourceFileId): readonly VocabularyEntry[] {
  return VOCABULARY[file];
}
