import { computed, Injectable, signal } from '@angular/core';
import { injectIsBrowser } from '../platform/browser';

const KEY = 'sandbox-front-end:v1:papel';

/** Quem esta maquina e na aula: quem conduz ou quem acompanha. */
export type Role = 'apresentador' | 'aluno';

function isRole(value: unknown): value is Role {
  return value === 'apresentador' || value === 'aluno';
}

/**
 * O papel escolhido na tela `/papel`. Todas as maquinas usam a mesma conta, entao
 * e so isso que diferencia o computador do professor dos da turma. Fica no
 * `localStorage`: um F5 nao pergunta de novo.
 */
@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly isBrowser = injectIsBrowser();
  private readonly current = signal<Role | null>(this.read());

  readonly role = this.current.asReadonly();
  readonly isPresenter = computed(() => this.current() === 'apresentador');
  readonly isStudent = computed(() => this.current() === 'aluno');

  choose(role: Role): void {
    this.current.set(role);
    this.write(role);
  }

  clear(): void {
    this.current.set(null);
    this.write(null);
  }

  private read(): Role | null {
    if (!this.isBrowser) return null;

    try {
      const saved = localStorage.getItem(KEY);
      return isRole(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  private write(role: Role | null): void {
    if (!this.isBrowser) return;

    try {
      if (role) localStorage.setItem(KEY, role);
      else localStorage.removeItem(KEY);
    } catch {
      // Sem armazenamento: o papel vale so ate o proximo F5.
    }
  }
}
