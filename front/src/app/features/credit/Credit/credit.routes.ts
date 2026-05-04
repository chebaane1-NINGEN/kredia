import { Routes } from '@angular/router';
import { CreditPageComponent } from './pages/credit-page/credit-page.component';
import { CreditRiskPageComponent } from './pages/credit-risk-page/credit-risk-page.component';
import { CreditListPageComponent } from './pages/credit-list-page/credit-list-page.component';
import { roleGuard } from '../../../core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'create',
    component: CreditPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] }
  },
  { path: 'list', component: CreditListPageComponent },
  {
    path: 'risk',
    component: CreditRiskPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] }
  },
  {
    path: 'chatbot',
    canActivate: [roleGuard],
    data: { roles: ['CLIENT'] },
    loadChildren: () => import('../Chatbot/chatbot.routes').then(m => m.routes)
  },
  {
    path: 'echeances',
    loadChildren: () => import('../Echeance/echeance.routes').then(m => m.routes)
  },
  {
    path: 'kyc',
    loadChildren: () => import('../KycLoan/kyc-loan.routes').then(m => m.routes)
  }
];
