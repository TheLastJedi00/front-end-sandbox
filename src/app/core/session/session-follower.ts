import { effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { BriefingStore } from '../services/briefing-store';
import { CodeStorage } from '../services/code-storage';
import { ProgressStore } from '../services/progress-store';
import { injectIsBrowser } from '../platform/browser';
import { LiveSession } from './live-session';
import { PresentationState, routeOf } from './presentation-state';
import { RoleStore } from './role-store';

/** Ultima aula que esta maquina viu comecar (o `startedAt` da sessao). */
const CLASS_KEY = 'sandbox-front-end:v1:aula';

/** Telas de entrada: ali a maquina ainda nao esta na aula, ninguem a puxa. */
const ENTRY_PATHS = ['/login', '/papel'];

/**
 * Para onde a maquina precisa ir para estar onde a turma esta, ou `null` se ja
 * esta la (ou se esta numa tela de entrada). Funcao pura, testavel.
 */
export function followTarget(url: string, state: PresentationState): string | null {
  const path = url.split(/[?#]/)[0] || '/';
  if (ENTRY_PATHS.includes(path)) return null;

  const target = routeOf(state).join('/').replace(/^\/\//, '/');
  return path === target ? null : target;
}

/**
 * Na maquina do aluno, quem escolhe a tela e a sessao: quando o professor muda
 * de etapa ou de fase, o router vai junto. Quem entra no meio da aula cai
 * direto onde a turma esta.
 */
@Injectable({ providedIn: 'root' })
export class SessionFollower {
  private readonly router = inject(Router);
  private readonly session = inject(LiveSession);
  private readonly roles = inject(RoleStore);
  private readonly code = inject(CodeStorage);
  private readonly progress = inject(ProgressStore);
  private readonly briefings = inject(BriefingStore);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    if (!injectIsBrowser()) return;

    effect(() => {
      const state = this.session.state();
      if (!state || !this.roles.isStudent()) return;

      const target = followTarget(this.url(), state);
      if (target) void this.router.navigateByUrl(target);
    });

    // "Reiniciar apresentacao" muda o `startedAt`: e uma turma nova sentando nas
    // mesmas maquinas, entao o codigo e o progresso da turma anterior saem.
    effect(() => {
      const state = this.session.state();
      if (!state || !this.session.exists()) return;
      this.startClass(String(state.startedAt));
    });
  }

  private startClass(startedAt: string): void {
    try {
      if (localStorage.getItem(CLASS_KEY) === startedAt) return;
      localStorage.setItem(CLASS_KEY, startedAt);
    } catch {
      return;
    }

    this.code.clearAll();
    this.progress.reset();
    this.briefings.reset();
  }
}
