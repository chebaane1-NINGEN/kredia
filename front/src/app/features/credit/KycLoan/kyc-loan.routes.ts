import { Routes } from '@angular/router';
import { KycLoanPageComponent } from './pages/kyc-loan-page/kyc-loan-page.component';
import { KycLoanAdminPageComponent } from './pages/kyc-loan-admin-page/kyc-loan-admin-page.component';

export const routes: Routes = [
  { path: '', component: KycLoanPageComponent },
  { path: 'admin', component: KycLoanAdminPageComponent }
];
