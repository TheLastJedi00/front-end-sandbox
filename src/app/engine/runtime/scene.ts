import { CssAnimation, CssParseResult, declaredValue, findAnimation } from '../parsers/css-parser';
import { AllowedTag, HtmlParseResult, findNode, isInside } from '../parsers/html-parser';

/** Cores com nome que o jogo reconhece, e o tom usado para desenha-las. */
export const NAMED_COLORS: Readonly<Record<string, string>> = {
  blue: 'var(--game-blue)',
  red: 'var(--game-red)',
  green: 'var(--game-green)',
  yellow: '#f2c14e',
  orange: '#e8833a',
  purple: '#9b6dff',
  pink: '#f06292',
  white: '#f5f5f5',
  black: '#1a1a1a',
  gray: '#8a8a8a',
  grey: '#8a8a8a',
  brown: '#8d6e63',
};

export interface SceneElement {
  readonly tag: AllowedTag;
  /** O elemento foi escrito no HTML. */
  readonly present: boolean;
  /** Esta dentro de <sky>, ou seja, aparece na cena. */
  readonly visible: boolean;
  /** Nome da cor escrita pelo aluno, ou null se nao houver. */
  readonly colorName: string | null;
  /** Cor pronta para desenhar; cinza quando nada foi declarado. */
  readonly color: string;
}

export interface Scene {
  readonly sky: SceneElement;
  readonly ground: SceneElement;
  readonly ball: SceneElement;
  /** Todas as animacoes declaradas no CSS, aplicadas ou nao. */
  readonly animations: readonly CssAnimation[];
  /** Nome da animacao aplicada em `ball`, se houver. */
  readonly ballAnimation: string | null;
  /** Definicao da animacao aplicada, quando ela existe no CSS. */
  readonly animation: CssAnimation | null;
}

const NO_COLOR = 'var(--border-strong)';

function resolveColor(name: string | null): string {
  if (!name) return NO_COLOR;
  return NAMED_COLORS[name.toLowerCase()] ?? name;
}

function buildElement(
  tag: AllowedTag,
  html: HtmlParseResult,
  css: CssParseResult,
  visible: boolean,
): SceneElement {
  const colorName = declaredValue(css, tag, 'color') ?? null;
  return {
    tag,
    present: findNode(html.nodes, tag) !== undefined,
    visible,
    colorName,
    color: resolveColor(colorName),
  };
}

/**
 * Junta estrutura (HTML) e aparencia (CSS) numa cena — a mesma combinacao que
 * o navegador faz de verdade, que e justamente o que a fase 1 quer mostrar.
 */
export function buildScene(html: HtmlParseResult, css: CssParseResult): Scene {
  const skyNode = findNode(html.nodes, 'sky');
  const ballAnimation = declaredValue(css, 'ball', 'animation')?.toLowerCase() ?? null;

  return {
    sky: buildElement('sky', html, css, skyNode !== undefined),
    ground: buildElement('ground', html, css, isInside(html.nodes, 'sky', 'ground')),
    ball: buildElement('ball', html, css, isInside(html.nodes, 'sky', 'ball')),
    animations: css.animations,
    ballAnimation,
    animation: ballAnimation ? (findAnimation(css, ballAnimation) ?? null) : null,
  };
}

export const EMPTY_SCENE: Scene = {
  sky: { tag: 'sky', present: false, visible: false, colorName: null, color: NO_COLOR },
  ground: { tag: 'ground', present: false, visible: false, colorName: null, color: NO_COLOR },
  ball: { tag: 'ball', present: false, visible: false, colorName: null, color: NO_COLOR },
  animations: [],
  ballAnimation: null,
  animation: null,
};

/**
 * Descricao em texto da cena, para quem usa leitor de tela — e util tambem
 * para conferir, em voz alta, o que mudou depois de uma edicao.
 */
export function describeScene(scene: Scene): string {
  if (!scene.sky.visible) return 'O palco está vazio: ainda não existe um céu.';

  const partes: string[] = [`Céu ${colorWord(scene.sky.colorName)}`];
  if (scene.ground.visible) partes.push(`terreno ${colorWord(scene.ground.colorName)}`);
  if (scene.ball.visible) partes.push(`bola ${colorWord(scene.ball.colorName)}`);
  if (scene.animation) partes.push(`a bola tem a animação ${scene.animation.name}`);

  return `${partes.join(', ')}.`;
}

function colorWord(name: string | null): string {
  return name ? `da cor ${name}` : 'sem cor definida';
}
