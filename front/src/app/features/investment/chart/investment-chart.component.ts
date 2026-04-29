import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { InvestmentAssetVm } from '../InvestmentAsset/vm/investment-asset.vm';
import { PortfolioPositionVm } from '../PortfolioPosition/vm/portfolio-position.vm';
import { InvestmentOrderVm } from '../InvestmentOrder/vm/investment-order.vm';

type MarketTrend = 'positive' | 'negative';

interface MarketSnapshot {
  label: string;
  value: string;
  change: string;
  trend: MarketTrend;
  code: string;
}

interface MarketMover {
  name: string;
  symbol: string;
  value: string;
  change: string;
  trend: MarketTrend;
}

@Component({
  selector: 'app-investment-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-chart.component.html',
  styleUrls: ['./investment-chart.component.scss']
})
export class InvestmentChartComponent implements OnInit {
  private readonly assetVm = inject(InvestmentAssetVm);
  private readonly positionVm = inject(PortfolioPositionVm);
  private readonly orderVm = inject(InvestmentOrderVm);
  private readonly cdr = inject(ChangeDetectorRef);

  marketSnapshots: MarketSnapshot[] = [
    { label: 'CAC 40', value: '8 072,63 EUR', change: '-0,39%', trend: 'negative', code: '40' },
    { label: 'SBF 120', value: '6 118,47 EUR', change: '-0,37%', trend: 'negative', code: '120' },
    { label: 'CAC All-Tradable', value: '5 997,65 EUR', change: '-0,37%', trend: 'negative', code: 'CT' },
    { label: 'CAC All-Share', value: '9 134,43 EUR', change: '-0,54%', trend: 'negative', code: 'CS' }
  ];

  timeframes = ['1D', '1M', '3M', '1Y', '5Y', 'Tout'];
  chartTools = ['</>', '▭', '◫', '⤢'];

  volumeLeaders: MarketMover[] = [];
  volatileLeaders: MarketMover[] = [];

  assetName = 'Kredia Market Index';
  assetPrice = 0;
  priceChange = 0;
  selectedTimeframe = '1D';

  prices: number[] = [];
  labels: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  loading = false;

  setTimeframe(timeframe: string): void {
    this.selectedTimeframe = timeframe;
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;

    const assets$ = this.assetVm.findAll().pipe(catchError(() => of([])));
    const positions$ = this.positionVm.findAll().pipe(catchError(() => of([])));
    const orders$ = this.orderVm.findAll().pipe(catchError(() => of([])));

    combineLatest([assets$, positions$, orders$]).subscribe({
      next: ([assets, positions, orders]) => {
        // Market snapshots from assets (fallback to defaults if none)
        if (Array.isArray(assets) && assets.length > 0) {
          this.marketSnapshots = assets.slice(0, 4).map((a: any, i: number) => ({
            label: a.assetName ?? a.name ?? a.symbol,
            value: a.currentPrice != null ? `${a.currentPrice} EUR` : '-',
            change: a.change ?? '-',
            trend: (a.change && String(a.change).startsWith('-')) ? 'negative' : 'positive',
            code: String(a.symbol ?? i)
          }));
        }

        // Volume leaders approximate from assets order
        this.volumeLeaders = (Array.isArray(assets) ? assets : []).slice(0, 6).map((a: any) => ({
          name: a.assetName ?? a.name ?? a.symbol,
          symbol: a.symbol ?? 'NA',
          value: a.currentPrice != null ? `${a.currentPrice} EUR` : '-',
          change: a.change ?? '+0,00%',
          trend: (a.change && String(a.change).startsWith('-')) ? 'negative' : 'positive'
        }));

        // Volatile leaders from positions by absolute percent change
        if (Array.isArray(positions) && positions.length > 0) {
          const byVol = positions.slice().sort((p1: any, p2: any) => Math.abs(p2.profitLossPercentage ?? 0) - Math.abs(p1.profitLossPercentage ?? 0));
          this.volatileLeaders = byVol.slice(0, 6).map((p: any) => ({
            name: p.assetSymbol,
            symbol: p.assetSymbol,
            value: p.currentMarketPrice != null ? `${p.currentMarketPrice} EUR` : '-',
            change: p.profitLossPercentage != null ? `${Number(p.profitLossPercentage).toFixed(2)}%` : '-',
            trend: (p.profitLossPercentage ?? 0) >= 0 ? 'positive' : 'negative'
          }));

          // Build a simple price series from positions currentMarketPrice (fallback)
          const series = positions.map((p: any) => Number(p.currentMarketPrice ?? p.avgPurchasePrice ?? 0)).filter(n => !Number.isNaN(n));
          if (series.length > 0) {
            this.prices = series;
            // create labels matching series length
            this.labels = series.map((_, idx) => `${8 + idx}:00`);
            this.assetPrice = series[series.length - 1];
            // use avg profitLossPercentage as priceChange proxy
            const avgPct = positions.reduce((s: number, p: any) => s + (Number(p.profitLossPercentage ?? 0)), 0) / positions.length;
            this.priceChange = Number(avgPct.toFixed(2));
          }
        }

        // Fallbacks if nothing returned
        if (!this.volumeLeaders.length) this.volumeLeaders = [];
        if (!this.volatileLeaders.length) this.volatileLeaders = [];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get changeClass(): MarketTrend {
    return this.priceChange >= 0 ? 'positive' : 'negative';
  }

  get marketDirection(): string {
    return this.priceChange >= 0 ? 'En hausse' : 'En baisse';
  }

  get minPrice(): number {
    return Math.min(...this.prices);
  }

  get maxPrice(): number {
    return Math.max(...this.prices);
  }

  get svgPoints(): string {
    const width = 1240;
    const height = 420;
    const padding = 28;
    const range = this.maxPrice - this.minPrice || 1;

    return this.prices
      .map((price, index) => {
        const x = padding + (index * (width - padding * 2)) / (this.prices.length - 1);
        const y = height - padding - ((price - this.minPrice) * (height - padding * 2)) / range;
        return `${x},${y}`;
      })
      .join(' ');
  }

  get areaPath(): string {
    const width = 1240;
    const height = 420;
    const padding = 28;
    const range = this.maxPrice - this.minPrice || 1;

    const points = this.prices.map((price, index) => {
      const x = padding + (index * (width - padding * 2)) / (this.prices.length - 1);
      const y = height - padding - ((price - this.minPrice) * (height - padding * 2)) / range;
      return { x, y };
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return `M ${firstPoint.x} ${height - padding} L ${points
      .map(point => `${point.x} ${point.y}`)
      .join(' L ')} L ${lastPoint.x} ${height - padding} Z`;
  }

  get xAxisLabels(): Array<{ label: string; position: number }> {
    return this.labels.map((label, index) => ({
      label,
      position: (index * 100) / (this.labels.length - 1)
    }));
  }

  get yAxisLabels(): number[] {
    return [8100, 8090, 8080, 8070, 8060, 8050, 8040];
  }

  getPointCx(index: number): number {
    return 28 + (index * 1184) / (this.prices.length - 1);
  }

  getPointCy(price: number): number {
    return 420 - 28 - ((price - this.minPrice) * 364) / (this.maxPrice - this.minPrice || 1);
  }

  getTrendClass(trend: MarketTrend): string {
    return trend === 'positive' ? 'positive' : 'negative';
  }

  trackByLabel(_: number, item: { label: string }): string {
    return item.label;
  }

  trackBySymbol(_: number, item: { symbol: string }): string {
    return item.symbol;
  }
}
