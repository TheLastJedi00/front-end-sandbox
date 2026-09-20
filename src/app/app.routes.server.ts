import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // As fases sao conhecidas em tempo de build, entao podem ser prerenderizadas.
    path: 'sandbox/:levelId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ levelId: '1' }, { levelId: '2' }, { levelId: '3' }],
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
