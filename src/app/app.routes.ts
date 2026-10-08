import { Routes } from '@angular/router';
import { requireLoggedOut, requireRoleChoice, requireSession } from './core/auth/guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sandbox Front-end — Entrar',
    canActivate: [requireLoggedOut],
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'papel',
    title: 'Sandbox Front-end — Papel',
    canActivate: [requireRoleChoice],
    loadComponent: () => import('./pages/role/role-page').then((m) => m.RolePage),
  },
  {
    path: '',
    canActivateChild: [requireSession],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Sandbox Front-end — Começar',
        loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'sandbox/:levelId',
        title: 'Sandbox Front-end',
        loadComponent: () => import('./pages/sandbox/sandbox-page').then((m) => m.SandboxPage),
      },
      {
        path: 'fim',
        title: 'Sandbox Front-end — Fim',
        loadComponent: () => import('./pages/finish/finish-page').then((m) => m.FinishPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
