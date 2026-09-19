/** Identificadores dos criterios verificaveis das tres fases. */
export type LevelCheckId =
  // Fase 1 — estrutura e cor
  | 'sky-exists'
  | 'ball-inside-sky'
  | 'ground-inside-sky'
  | 'sky-blue'
  | 'ball-red'
  | 'ground-green'
  // Fase 2 — animacao
  | 'animation-declared'
  | 'animation-applied'
  | 'ball-jumped'
  // Fase 3 — comportamento
  | 'move-forward'
  | 'move-backward'
  | 'jump-on-space'
  | 'goal-reached';

export interface LevelCheck {
  readonly id: LevelCheckId;
  /** Texto mostrado na lista de objetivos da fase. */
  readonly label: string;
}

export interface CheckResult extends LevelCheck {
  readonly done: boolean;
}

export interface ValidationResult {
  readonly checks: readonly CheckResult[];
  readonly completed: boolean;
}

export const EMPTY_VALIDATION: ValidationResult = { checks: [], completed: false };
