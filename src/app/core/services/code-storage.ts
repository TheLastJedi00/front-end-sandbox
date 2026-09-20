import { Injectable } from '@angular/core';
import { SourceCode } from '../models';
import { injectIsBrowser } from '../platform/browser';

const PREFIX = 'sandbox-front-end:level:';

/**
 * Guarda o codigo de cada fase no navegador. Serve para um caso bem concreto:
 * um F5 acidental no meio da apresentacao nao pode apagar o que o aluno escreveu.
 */
@Injectable({ providedIn: 'root' })
export class CodeStorage {
  private readonly isBrowser = injectIsBrowser();

  load(levelId: number): SourceCode | null {
    if (!this.isBrowser) return null;

    try {
      const saved = localStorage.getItem(PREFIX + levelId);
      if (!saved) return null;

      const parsed: unknown = JSON.parse(saved);
      return this.isSourceCode(parsed) ? parsed : null;
    } catch {
      // Modo anonimo ou armazenamento bloqueado: seguir sem persistencia.
      return null;
    }
  }

  save(levelId: number, code: SourceCode): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(PREFIX + levelId, JSON.stringify(code));
    } catch {
      // Sem espaco ou sem permissao: perder o rascunho e melhor que quebrar a aula.
    }
  }

  clear(levelId: number): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(PREFIX + levelId);
    } catch {
      // Nada a fazer.
    }
  }

  private isSourceCode(value: unknown): value is SourceCode {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate['html'] === 'string' &&
      typeof candidate['css'] === 'string' &&
      typeof candidate['js'] === 'string'
    );
  }
}
