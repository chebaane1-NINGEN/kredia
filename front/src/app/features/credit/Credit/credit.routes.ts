import { Routes } from '@angular/router';
import { CreditPageComponent } from './pages/credit-page/credit-page.component';
import { CreditRiskPageComponent } from './pages/credit-risk-page/credit-risk-page.component';
import { CreditListPageComponent } from './pages/credit-list-page/credit-list-page.component';

export const routes: Routes = [
  { path: 'create', component: CreditPageComponent },
  { path: 'list', component: CreditListPageComponent },
  { path: 'risk', component: CreditRiskPageComponent },
  {
    path: 'chatbot',
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
