/** Identificadores dos criterios verificaveis das tres fases. */
export type LevelCheckId =
  // Fase 1 (HTML) — estrutura: quais elementos existem e quem esta dentro de quem
  | 'sky-exists'
  | 'ball-inside-sky'
  | 'ground-inside-sky'
  // Fase 2 (CSS) — aparencia: a cor de cada elemento
  | 'sky-blue'
  | 'ball-red'
  | 'ground-green'
  // Fase 2 (CSS) — movimento: a animacao do pulo
  | 'animation-declared'
  | 'animation-applied'
  | 'ball-jumped'
  // Fase 3 (JavaScript) — comportamento
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
