import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'batches',
  },
  {
    path: 'import',
    loadComponent: () => import('./pages/import/import').then((m) => m.Import),
  },
  {
    path: 'batches',
    loadComponent: () => import('./pages/batches/batches').then((m) => m.Batches),
  },
  {
    path: 'batches/:batchId',
    loadComponent: () => import('./pages/batch/batch').then((m) => m.Batch),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
