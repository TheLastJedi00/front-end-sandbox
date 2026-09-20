import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { GameState, GOAL_MIN_HEIGHT, GOAL_X, INITIAL_GAME_STATE } from '../../core/models';
import { injectIsBrowser } from '../../core/platform/browser';
import { CssAnimation } from '../parsers/css-parser';
import { Action, KeyHandler } from '../parsers/js-parser';
import { JUMP_DURATION_MS, jumpHeight } from './animator';
import { PressedKeys } from './input';

/** Velocidade horizontal da bola, em porcentagem do palco por segundo. */
const MOVE_SPEED = 38;
/** Distancia ate o alvo que ainda conta como "em cima dele". */
const GOAL_TOLERANCE = 7;

export interface LoopConfig {
  /** Animacao aplicada em `ball`, quando existe. */
  readonly animation: CssAnimation | null;
  /** Comandos escritos no JS. Vazio nas fases 1 e 2. */
  readonly handlers: readonly KeyHandler[];
  /** O teclado controla a bola (fase 3). */
  readonly interactive: boolean;
  /** A bola pula sozinha em loop, para mostrar a animacao (fase 2). */
  readonly autoJump: boolean;
}

const IDLE: LoopConfig = { animation: null, handlers: [], interactive: false, autoJump: false };

/**
 * Relogio do jogo. Aplica, a cada quadro, as acoes que o aluno escreveu.
 * Nao interpreta texto: recebe do parser uma lista de acoes por tecla.
 */
@Injectable()
export class GameLoop {
  private readonly isBrowser = injectIsBrowser();

  readonly state = signal<GameState>(INITIAL_GAME_STATE);
  readonly keys = new PressedKeys();

  private config: LoopConfig = IDLE;
  private frame: number | null = null;
  private previous = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  configure(config: LoopConfig): void {
    this.config = config;
  }

  start(): void {
    if (!this.isBrowser || this.frame !== null) return;
    this.previous = performance.now();
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  stop(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.keys.clear();
  }

  reset(): void {
    this.keys.clear();
    this.state.set(INITIAL_GAME_STATE);
  }

  private tick(now: number): void {
    // Quadros longos (aba em segundo plano) nao devem teleportar a bola.
    const delta = Math.min((now - this.previous) / 1000, 0.05);
    this.previous = now;

    this.state.update((state) => this.advance(state, delta));
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  private advance(state: GameState, delta: number): GameState {
    const { animation, handlers, interactive, autoJump } = this.config;

    let x = state.x;
    let jumpProgress = state.jumpProgress;
    let hasJumped = state.hasJumped;

    if (interactive) {
      for (const handler of handlers) {
        if (!this.keys.isDown(handler.key)) continue;
        for (const action of handler.actions) {
          ({ x, jumpProgress } = this.apply(action, { x, jumpProgress }, delta, animation));
        }
      }
    }

    if (autoJump && jumpProgress === null && animation) {
      jumpProgress = 0;
    }

    if (jumpProgress !== null) {
      hasJumped = true;
      const next = jumpProgress + (delta * 1000) / JUMP_DURATION_MS;
      jumpProgress = next >= 1 ? (autoJump ? 0 : null) : next;
    }

    const y = jumpHeight(animation, jumpProgress);
    const clampedX = Math.min(100, Math.max(0, x));
    const reachedGoal =
      state.reachedGoal ||
      (interactive && Math.abs(clampedX - GOAL_X) <= GOAL_TOLERANCE && y >= GOAL_MIN_HEIGHT);

    return { x: clampedX, y, jumpProgress, hasJumped, reachedGoal };
  }

  private apply(
    action: Action,
    current: { x: number; jumpProgress: number | null },
    delta: number,
    animation: CssAnimation | null,
  ): { x: number; jumpProgress: number | null } {
    switch (action.kind) {
      case 'avancar':
        return { ...current, x: current.x + MOVE_SPEED * delta };
      case 'recuar':
        return { ...current, x: current.x - MOVE_SPEED * delta };
      case 'animar': {
        const applies =
          action.target === 'ball' && animation !== null && action.animation === animation.name;
        // Um pulo por vez: segurar espaco nao acumula altura.
        return applies && current.jumpProgress === null ? { ...current, jumpProgress: 0 } : current;
      }
    }
  }
}
