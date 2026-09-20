import { CssAnimation, Keyframe, KeyframeStep } from '../parsers/css-parser';
import { MAX_JUMP_HEIGHT } from './renderer';

/** Duracao de um pulo completo. */
export const JUMP_DURATION_MS = 700;

/** Onde cada momento acontece na linha do tempo da animacao. */
const STEP_TIME: Readonly<Record<KeyframeStep, number>> = {
  inicio: 0,
  meio: 0.5,
  fim: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Valor da animacao em um instante, interpolando entre os momentos declarados.
 * Momentos faltando nao quebram a animacao: o valor simplesmente se mantem.
 */
export function sampleKeyframes(keyframes: readonly Keyframe[], progress: number): number {
  if (keyframes.length === 0) return 0;

  const points = keyframes
    .map((frame) => ({ time: STEP_TIME[frame.step], value: frame.position }))
    .sort((a, b) => a.time - b.time);

  const time = clamp(progress, 0, 1);
  if (time <= points[0].time) return points[0].value;

  const last = points[points.length - 1];
  if (time >= last.time) return last.value;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    if (time >= from.time && time <= to.time) {
      const span = to.time - from.time;
      const ratio = span === 0 ? 1 : (time - from.time) / span;
      return from.value + (to.value - from.value) * ratio;
    }
  }

  return last.value;
}

/**
 * Altura da bola, em porcentagem do palco, para um instante do pulo.
 * `position: 1` no CSS significa o topo do pulo.
 */
export function jumpHeight(animation: CssAnimation | null, progress: number | null): number {
  if (!animation || progress === null) return 0;
  const position = sampleKeyframes(animation.keyframes, progress);
  return clamp(position, 0, 1) * MAX_JUMP_HEIGHT;
}
