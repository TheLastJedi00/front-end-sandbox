import { computed, Injectable, signal } from '@angular/core';
import { injectIsBrowser } from '../platform/browser';

const KEY = 'sandbox-front-end:progresso';

/**
 * Quais fases ja foram concluidas. Fica guardado no navegador pelo mesmo motivo
 * que o codigo: um refresh no meio da apresentacao nao pode apagar o caminho
 * que o aluno ja andou.
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly isBrowser = injectIsBrowser();
  private readonly completed = signal<ReadonlySet<number>>(this.read());

  readonly completedCount = computed(() => this.completed().size);

  isCompleted(levelId: number): boolean {
    return this.completed().has(levelId);
  }

  markCompleted(levelId: number): void {
    if (this.completed().has(levelId)) return;

    const next = new Set(this.completed()).add(levelId);
    this.completed.set(next);
    this.write(next);
  }

  reset(): void {
    this.completed.set(new Set<number>());
    this.write(new Set<number>());
  }

  private read(): ReadonlySet<number> {
    if (!this.isBrowser) return new Set<number>();

    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return new Set<number>();

      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed)
        ? new Set(parsed.filter((id): id is number => typeof id === 'number'))
        : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }

  private write(levels: ReadonlySet<number>): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(KEY, JSON.stringify([...levels]));
    } catch {
      // Sem armazenamento: o progresso vale so para esta sessao.
    }
  }
}
