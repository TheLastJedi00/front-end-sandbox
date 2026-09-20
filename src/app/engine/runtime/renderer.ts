import { GameState, GOAL_X } from '../../core/models';
import { Scene } from './scene';

/** Medidas do palco, em porcentagem — o preview funciona em qualquer tamanho. */
export const GROUND_HEIGHT = 22;
export const BALL_SIZE = 10;
export const MAX_JUMP_HEIGHT = 42;

export interface RenderModel {
  readonly skyColor: string;
  readonly ground: {
    readonly visible: boolean;
    readonly color: string;
    readonly height: number;
  };
  readonly ball: {
    readonly visible: boolean;
    readonly color: string;
    readonly left: number;
    readonly bottom: number;
    readonly size: number;
  };
  readonly goal: {
    readonly visible: boolean;
    readonly left: number;
    readonly bottom: number;
    readonly reached: boolean;
  };
}

/**
 * Traduz cena + estado em medidas de tela. E TypeScript puro: quem desenha e o
 * componente de preview, que apenas aplica esses numeros como estilo.
 */
export function toRenderModel(
  scene: Scene,
  state: GameState,
  options: { readonly showGoal: boolean },
): RenderModel {
  return {
    skyColor: scene.sky.visible ? scene.sky.color : 'transparent',
    ground: {
      visible: scene.ground.visible,
      color: scene.ground.color,
      height: GROUND_HEIGHT,
    },
    ball: {
      visible: scene.ball.visible,
      color: scene.ball.color,
      left: state.x,
      bottom: GROUND_HEIGHT + state.y,
      size: BALL_SIZE,
    },
    goal: {
      visible: options.showGoal,
      left: GOAL_X,
      bottom: GROUND_HEIGHT,
      reached: state.reachedGoal,
    },
  };
}
