import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'batches',
    loadComponent: () => import('./pages/batches/batches').then((m) => m.Batches),
  },
  {
    path: 'batch/:batchId',
    loadComponent: () => import('./pages/batch/batch').then((m) => m.Batch),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
