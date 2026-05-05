import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ── Pages Credit ───────────────────────────────────────
import { CreditPageComponent } from './Credit/pages/credit-page/credit-page.component';
import { CreditListPageComponent } from './Credit/pages/credit-list-page/credit-list-page.component';
import { CreditRiskPageComponent } from './Credit/pages/credit-risk-page/credit-risk-page.component';

// ── Pages Echeance ─────────────────────────────────────
import { EcheancePageComponent } from './Echeance/pages/echeance-page/echeance-page.component';

// ── Pages Chatbot ──────────────────────────────────────
import { ChatbotPageComponent } from './Chatbot/pages/chatbot-page/chatbot-page.component';

// ── Pages KycLoan ──────────────────────────────────────
import { KycLoanPageComponent } from './KycLoan/pages/kyc-loan-page/kyc-loan-page.component';
import { KycLoanAdminPageComponent } from './KycLoan/pages/kyc-loan-admin-page/kyc-loan-admin-page.component';

// ── Pages Simulateur ───────────────────────────────────────
import { SimulateurHomePageComponent } from './Simulateur/pages/simulateur-home-page/simulateur-home-page.component';
import { SimulateurFormPageComponent } from './Simulateur/pages/simulateur-form-page/simulateur-form-page.component';

// ── Routing ────────────────────────────────────────────
import { CreditRoutingModule } from './credit-routing.module';

@NgModule({
  declarations: [
    CreditPageComponent,
    CreditListPageComponent,
    CreditRiskPageComponent,
    EcheancePageComponent,
    ChatbotPageComponent,
    KycLoanPageComponent,
    KycLoanAdminPageComponent,
    SimulateurHomePageComponent,
    SimulateurFormPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CreditRoutingModule,
  ],
})
export class CreditModule { }
