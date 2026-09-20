import { Injectable } from '@angular/core';
import { injectIsBrowser } from '../platform/browser';

const KEY = 'sandbox-front-end:v2:briefings';

/**
 * Quais fases ja mostraram o seu slide de conceito. Vive no `sessionStorage`:
 * dentro da mesma apresentacao o slide nao reaparece quando o aluno volta a uma
 * fase, e uma nova sessao comeca a apresentacao do zero.
 */
@Injectable({ providedIn: 'root' })
export class BriefingStore {
  private readonly isBrowser = injectIsBrowser();
  private readonly seen = new Set<number>(this.read());

  wasSeen(levelId: number): boolean {
    return this.seen.has(levelId);
  }

  markSeen(levelId: number): void {
    if (this.seen.has(levelId)) return;

    this.seen.add(levelId);
    this.write();
  }

  private read(): readonly number[] {
    if (!this.isBrowser) return [];

    try {
      const saved = sessionStorage.getItem(KEY);
      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
    } catch {
      // Armazenamento bloqueado: o slide reaparece, e o apresentador pula.
      return [];
    }
  }

  private write(): void {
    if (!this.isBrowser) return;

    try {
      sessionStorage.setItem(KEY, JSON.stringify([...this.seen]));
    } catch {
      // Sem persistencia: vale so para esta navegacao.
    }
  }
}
