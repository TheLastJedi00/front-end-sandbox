import { computed, Injectable, signal } from '@angular/core';

/** Quais fases ja foram concluidas nesta sessao. */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly completed = signal<ReadonlySet<number>>(new Set<number>());

  readonly completedCount = computed(() => this.completed().size);

  isCompleted(levelId: number): boolean {
    return this.completed().has(levelId);
  }

  markCompleted(levelId: number): void {
    if (this.completed().has(levelId)) return;
    this.completed.update((done) => new Set(done).add(levelId));
  }

  reset(): void {
    this.completed.set(new Set<number>());
  }
}
