import type { Routes } from '@angular/router';

export const devRoutes: Routes = [
  {
    path: 'dev/ui-stress',
    loadComponent: () => import('./ui-stress.component'),
    title: 'UI stress test - Trakify',
  },
];
