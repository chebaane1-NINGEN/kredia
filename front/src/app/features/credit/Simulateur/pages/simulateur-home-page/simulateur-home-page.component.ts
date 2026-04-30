import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface RepaymentCard {
  type: 'MENSUALITE_CONSTANTE' | 'AMORTISSEMENT_CONSTANT' | 'IN_FINE';
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  gradient: string;
  accentColor: string;
}

@Component({
  standalone: false,
  templateUrl: './simulateur-home-page.component.html',
  styleUrl:    './simulateur-home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulateurHomePageComponent {
  private readonly router = inject(Router);

  readonly cards: RepaymentCard[] = [
    {
      type:        'MENSUALITE_CONSTANTE',
      icon:        '📅',
      title:       'Mensualité Constante',
      subtitle:    'Paiement régulier & prévisible',
      description: 'Le client paie la même mensualité chaque mois. Idéal pour budgéter facilement vos remboursements sur toute la durée du crédit.',
      badge:       'Taux fixe annuel : 15 %',
      gradient:    'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
      accentColor: '#1b6ca8',
    },
    {
      type:        'AMORTISSEMENT_CONSTANT',
      icon:        '📉',
      title:       'Amortissement Constant',
      subtitle:    'Capital fixe, intérêts décroissants',
      description: 'Le capital remboursé chaque mois reste constant. Les mensualités diminuent progressivement grâce à la réduction des intérêts.',
      badge:       'Taux fixe annuel : 15 %',
      gradient:    'linear-gradient(135deg, #005f40 0%, #00a86b 100%)',
      accentColor: '#00a86b',
    },
    {
      type:        'IN_FINE',
      icon:        '🏦',
      title:       'In Fine',
      subtitle:    'Intérêts seuls, capital en fin',
      description: 'Le client paie uniquement les intérêts chaque mois. Le capital est remboursé intégralement à la dernière échéance.',
      badge:       'Taux fixe annuel : 15 %',
      gradient:    'linear-gradient(135deg, #4a0080 0%, #9b30d9 100%)',
      accentColor: '#9b30d9',
    },
  ];

  chooseType(type: RepaymentCard['type']): void {
    this.router.navigate(['/credit/simulateur', type]);
  }
}
