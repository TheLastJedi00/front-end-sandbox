import { effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { injectIsBrowser } from '../platform/browser';
import { LiveSession } from './live-session';
import { PresentationState, routeOf } from './presentation-state';
import { RoleStore } from './role-store';

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
  }
}
