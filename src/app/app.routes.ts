import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '**', redirectTo: '' },
];
