import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, authChildGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ── Public ─────────────────────────────────────────────
  { path: '',      component: HomeComponent, pathMatch: 'full' },
  { path: 'home',  component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // ── Credit ─────────────────────────────────────────────
  {
    path: 'credit',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/credit/Credit/credit.routes').then(m => m.routes)
  },

  // ── User ───────────────────────────────────────────────
  {
    path: 'user',
    canActivate: [authGuard, roleGuard],
    canActivateChild: [authChildGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/user/User/user.routes').then(m => m.routes)
  },
  {
    path: 'user/kyc-doc',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/user/KycDocument/kyc-document.routes').then(m => m.routes)
  },

  // ── Wallet ─────────────────────────────────────────────
  {
    path: 'wallet',
    canActivate: [authGuard, roleGuard],
    canActivateChild: [authGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/wallet/Wallet/wallet.routes').then(m => m.routes)
  },
  {
    path: 'wallet/transactions',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/wallet/Transaction/transaction.routes').then(m => m.routes)
  },
  {
    path: 'wallet/audit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/wallet/TransactionAuditLog/transaction-audit-log.routes').then(m => m.routes)
  },
  {
    path: 'wallet/loan-transactions',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/wallet/TransactionLoan/transaction-loan.routes').then(m => m.routes)
  },
  {
    path: 'wallet/virtual-card',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/wallet/VirtualCard/virtual-card.routes').then(m => m.routes)
  },

  // ── Support ────────────────────────────────────────────
  {
    path: 'support/notifications',
    redirectTo: 'support/reclamations',
    pathMatch: 'full'
  },
  {
    path: 'support/reclamations',
    canActivate: [authGuard],
    loadChildren: () => import('./features/support/Reclamation/reclamation.routes').then(m => m.routes)
  },
  {
    path: 'support/reclamation-attachments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/support/ReclamationAttachment/reclamation-attachment.routes').then(m => m.routes)
  },
  {
    path: 'support/reclamation-history',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/support/ReclamationHistory/reclamation-history.routes').then(m => m.routes)
  },
  {
    path: 'support/reclamation-messages',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AGENT', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/support/ReclamationMessage/reclamation-message.routes').then(m => m.routes)
  },

  // ── Investment ─────────────────────────────────────────
  {
    path: 'investissement/assets',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/investment/InvestmentAsset/investment-asset.routes').then(m => m.routes)
  },
  {
    path: 'investissement/orders',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/investment/InvestmentOrder/investment-order.routes').then(m => m.routes)
  },
  {
    path: 'investissement/strategies',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/investment/InvestmentStrategy/investment-strategy.routes').then(m => m.routes)
  },
  {
    path: 'investissement/portfolio',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadChildren: () => import('./features/investment/PortfolioPosition/portfolio-position.routes').then(m => m.routes)
  },

  // ── Fallback ───────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
