import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreditPageComponent }     from './Credit/pages/credit-page/credit-page.component';
import { CreditListPageComponent } from './Credit/pages/credit-list-page/credit-list-page.component';
import { CreditRiskPageComponent } from './Credit/pages/credit-risk-page/credit-risk-page.component';
import { EcheancePageComponent }   from './Echeance/pages/echeance-page/echeance-page.component';
import { ChatbotPageComponent }    from './Chatbot/pages/chatbot-page/chatbot-page.component';
import { KycLoanPageComponent }    from './KycLoan/pages/kyc-loan-page/kyc-loan-page.component';
import { SimulateurHomePageComponent } from './Simulateur/pages/simulateur-home-page/simulateur-home-page.component';
import { SimulateurFormPageComponent } from './Simulateur/pages/simulateur-form-page/simulateur-form-page.component';

const routes: Routes = [
  { path: 'create',    component: CreditPageComponent },
  { path: 'list',      component: CreditListPageComponent },
  { path: 'risk',      component: CreditRiskPageComponent },
  { path: 'echeances', component: EcheancePageComponent },
  { path: 'chatbot',   component: ChatbotPageComponent },
  { path: 'kyc',          component: KycLoanPageComponent },
  { path: 'simulateur',         component: SimulateurHomePageComponent },
  { path: 'simulateur/:type',   component: SimulateurFormPageComponent },
  { path: '',                   redirectTo: 'list', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreditRoutingModule {}
