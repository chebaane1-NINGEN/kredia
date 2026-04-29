import { Routes } from '@angular/router';
import { InvestmentChartComponent } from './chart/investment-chart.component';

export const routes: Routes = [
  {
    path: '',
    component: InvestmentChartComponent,
    title: 'Investment Dashboard'
  },
  {
    path: 'chart',
    component: InvestmentChartComponent,
    title: 'Investment Dashboard'
  }
];
