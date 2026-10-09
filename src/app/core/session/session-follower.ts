import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { BriefingStore } from '../services/briefing-store';
import { CodeStorage } from '../services/code-storage';
import { ProgressStore } from '../services/progress-store';
import { AuthStore } from '../auth/auth-store';
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
 * O apresentador que chega a abertura (depois do login ou de um F5) com a aula
 * ja andando volta para onde a turma esta, em vez de recomecar sozinho.
 * Fora da abertura, a rota em que ele esta e escolha dele.
 */
export function resumeTarget(url: string, state: PresentationState): string | null {
  const path = url.split(/[?#]/)[0] || '/';
  return path === '/' ? followTarget(url, state) : null;
}

/**
 * Na maquina do aluno, quem escolhe a tela e a sessao: quando o professor muda
 * de etapa ou de fase, o router vai junto. Quem entra no meio da aula cai
 * direto onde a turma esta. Na do apresentador, so a retomada (ver
 * `resumeTarget`).
 */
@Injectable({ providedIn: 'root' })
export class SessionFollower {
  private readonly router = inject(Router);
  private readonly session = inject(LiveSession);
  private readonly roles = inject(RoleStore);
  private readonly auth = inject(AuthStore);
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

  /** A rota do passo para onde o apresentador acabou de voltar. */
  private readonly backTarget = signal<string | null>(null);

  constructor() {
    if (!injectIsBrowser()) return;

    effect(() => {
      const state = this.session.state();
      if (!state || !this.roles.isStudent()) return;

      const target = followTarget(this.url(), state);
      if (target) void this.router.navigateByUrl(target);
    });

    // Uma vez por login: a primeira leitura da sessao decide a retomada.
    let resumedFor: string | null = null;
    effect(() => {
      const uid = this.auth.uid();
      const state = this.session.state();
      if (!uid) resumedFor = null;
      if (!uid || !state || resumedFor === uid || !this.roles.isPresenter()) return;
      if (!this.session.exists()) return;

      resumedFor = uid;
      const target = resumeTarget(untracked(this.url), state);
      if (target) void this.router.navigateByUrl(target);
    });

    // Depois de um "Voltar", o apresentador vai para a tela do passo anterior
    // so quando a sessao ja diz que a aula esta la. Navegar antes faria a fase
    // de chegada achar que ele entrou sozinho e reabrir o conceito do comeco.
    effect(() => {
      const target = this.backTarget();
      const state = this.session.state();
      if (!target || !state || routeOf(state).join('/') !== target) return;

      this.backTarget.set(null);
      const route = followTarget(untracked(this.url), state);
      if (route) void this.router.navigateByUrl(route);
    });

    // "Reiniciar apresentacao" muda o `startedAt`: e uma turma nova sentando nas
    // mesmas maquinas, entao o codigo e o progresso da turma anterior saem.
    effect(() => {
      const state = this.session.state();
      if (!state || !this.session.exists()) return;
      this.startClass(String(state.startedAt));
    });
  }

  /** Apresentador: volta um passo da aula e leva a propria tela junto. */
  back(): void {
    if (!this.roles.isPresenter()) return;
    const target = this.session.back();
    if (target) this.backTarget.set(routeOf(target).join('/'));
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
