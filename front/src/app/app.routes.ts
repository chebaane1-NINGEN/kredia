import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'credit',
    loadChildren: () => import('./features/credit/Credit/credit.routes').then(m => m.routes)
  },
  { path: '**', redirectTo: '' }
];
