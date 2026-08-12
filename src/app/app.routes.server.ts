import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Play ids are dynamic (created client-side, stored in localStorage) and can't be enumerated at build time.
  {
    path: 'playbook/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
