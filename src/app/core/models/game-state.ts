/**
 * Estado do jogo em um instante. As coordenadas sao percentuais do palco
 * (0 a 100 na horizontal, 0 a 100 de altura acima do terreno), para que o
 * preview funcione em qualquer tamanho de tela — inclusive num projetor.
 */
export interface GameState {
  /** Posicao horizontal da bola, 0 = esquerda, 100 = direita. */
  readonly x: number;
  /** Altura da bola acima do terreno, 0 = encostando no chao. */
  readonly y: number;
  /** Progresso da animacao de pulo, de 0 a 1; null quando nao esta pulando. */
  readonly jumpProgress: number | null;
  /** Ja pulou pelo menos uma vez desde o ultimo reset. */
  readonly hasJumped: boolean;
  /** Alcancou o alvo no fim do terreno. */
  readonly reachedGoal: boolean;
}

export const INITIAL_GAME_STATE: GameState = {
  x: 12,
  y: 0,
  jumpProgress: null,
  hasJumped: false,
  reachedGoal: false,
};

/** Posicao horizontal do alvo e altura minima para alcanca-lo (exige um pulo). */
export const GOAL_X = 86;
export const GOAL_MIN_HEIGHT = 30;
