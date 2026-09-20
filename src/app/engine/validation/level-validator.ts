import {
  CheckResult,
  GameState,
  LevelCheckId,
  LevelDefinition,
  ValidationResult,
} from '../../core/models';
import { KEYFRAME_STEPS } from '../parsers/css-parser';
import { handlerFor, JsParseResult } from '../parsers/js-parser';
import { Scene } from '../runtime/scene';

export interface ValidationInput {
  readonly level: LevelDefinition;
  readonly scene: Scene;
  readonly js: JsParseResult;
  readonly state: GameState;
}

function hasAction(js: JsParseResult, key: string, kind: 'avancar' | 'recuar'): boolean {
  return handlerFor(js, key)?.actions.some((action) => action.kind === kind) ?? false;
}

function jumpsOnKey(input: ValidationInput, key: string): boolean {
  const animation = input.scene.animation;
  if (!animation) return false;

  return (
    handlerFor(input.js, key)?.actions.some(
      (action) =>
        action.kind === 'animar' &&
        action.target === 'ball' &&
        action.animation === animation.name,
    ) ?? false
  );
}

/**
 * Cada criterio olha o resultado, nao o texto digitado: espacos, ordem das
 * regras e formatacao ficam por conta do aluno.
 */
const CHECKS: Readonly<Record<LevelCheckId, (input: ValidationInput) => boolean>> = {
  'sky-exists': ({ scene }) => scene.sky.visible,
  'ball-inside-sky': ({ scene }) => scene.ball.visible,
  'ground-inside-sky': ({ scene }) => scene.ground.visible,
  'sky-blue': ({ scene }) => scene.sky.colorName === 'blue',
  'ball-red': ({ scene }) => scene.ball.colorName === 'red',
  'ground-green': ({ scene }) => scene.ground.colorName === 'green',

  'animation-declared': ({ scene }) =>
    scene.animation !== null &&
    KEYFRAME_STEPS.every((step) => scene.animation!.keyframes.some((frame) => frame.step === step)),
  'animation-applied': ({ scene }) => scene.ball.visible && scene.animation !== null,
  'ball-jumped': ({ state }) => state.hasJumped,

  'move-forward': ({ js }) => hasAction(js, 'D', 'avancar'),
  'move-backward': ({ js }) => hasAction(js, 'A', 'recuar'),
  'jump-on-space': (input) => jumpsOnKey(input, 'SPACE'),
  'goal-reached': ({ state }) => state.reachedGoal,
};

export function validateLevel(input: ValidationInput): ValidationResult {
  const checks: CheckResult[] = input.level.checks.map((check) => ({
    ...check,
    done: CHECKS[check.id](input),
  }));

  return { checks, completed: checks.length > 0 && checks.every((check) => check.done) };
}
