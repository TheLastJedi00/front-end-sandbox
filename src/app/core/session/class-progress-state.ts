/** `sessoes/{uid}/maquinas/{maquina}`: uma maquina entrou como aluno na aula. */
export interface MachinePresence {
  readonly machine: string;
  /** Epoch ms. */
  readonly at: number;
}

/** `sessoes/{uid}/conclusoes/{maquina}-{fase}`: uma maquina concluiu a missao. */
export interface LevelCompletion {
  readonly levelId: number;
  readonly machine: string;
  /** Epoch ms. */
  readonly at: number;
}

/** O que o popup do apresentador mostra. */
export interface ClassProgress {
  readonly done: number;
  readonly total: number;
  /** De 0 a 1. */
  readonly ratio: number;
  /** Todos os alunos presentes concluiram (e ha pelo menos um). */
  readonly complete: boolean;
}

/**
 * Quantas maquinas desta aula concluiram a fase, de quantas entraram como
 * aluno. O que e anterior a `startedAt` e de uma aula passada e nao conta, e
 * so contam conclusoes de maquinas presentes. Funcao pura.
 */
export function classProgress(
  machines: readonly MachinePresence[],
  completions: readonly LevelCompletion[],
  levelId: number,
  startedAt: number,
): ClassProgress {
  const present = new Set(machines.filter((m) => m.at >= startedAt).map((m) => m.machine));
  const finished = new Set(
    completions
      .filter((c) => c.levelId === levelId && c.at >= startedAt && present.has(c.machine))
      .map((c) => c.machine),
  );

  const total = present.size;
  const done = finished.size;
  return {
    done,
    total,
    ratio: total === 0 ? 0 : done / total,
    complete: total > 0 && done === total,
  };
}

/** O id do documento de conclusao: uma maquina conta uma vez so por fase. */
export function completionId(machine: string, levelId: number): string {
  return `${machine}-${levelId}`;
}

export function progressLabel({ done, total }: ClassProgress): string {
  if (total === 0) return 'Nenhum aluno conectado ainda';
  return `${done} de ${total} ${total === 1 ? 'aluno terminou' : 'alunos terminaram'}`;
}
