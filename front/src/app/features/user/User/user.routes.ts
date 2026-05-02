import { Routes } from '@angular/router';
import { UserPageComponent } from './pages/user-page/user-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'profile', component: UserPageComponent }
];
