import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { injectIsBrowser } from '../platform/browser';
import { RoleStore } from '../session/role-store';
import { AuthStore } from './auth-store';

/**
 * Para onde a maquina deve ir dado o que ja sabe dela: sem login, `/login`;
 * sem papel, `/papel`; com os dois, a apresentacao. Funcao pura, testavel.
 */
export function entryRoute(loggedIn: boolean, hasRole: boolean): '/login' | '/papel' | '/' {
  if (!loggedIn) return '/login';
  if (!hasRole) return '/papel';
  return '/';
}

/**
 * No prerender nao ha sessao: os guards liberam e quem decide e o navegador,
 * que roda a navegacao inicial de novo depois de hidratar.
 */
function guard(allow: (target: string) => boolean): CanActivateFn {
  return async (): Promise<boolean | UrlTree> => {
    if (!injectIsBrowser()) return true;

    const auth = inject(AuthStore);
    const roles = inject(RoleStore);
    const router = inject(Router);

    await auth.whenReady;
    const target = entryRoute(auth.isLoggedIn(), roles.role() !== null);
    return allow(target) ? true : router.parseUrl(target);
  };
}

/** Rotas da apresentacao: exigem login e papel. */
export const requireSession = guard((target) => target === '/');

/** `/papel`: exige login; quem ja escolheu o papel segue para a apresentacao. */
export const requireRoleChoice = guard((target) => target === '/papel');

/** `/login`: so para quem ainda nao entrou. */
export const requireLoggedOut = guard((target) => target === '/login');
