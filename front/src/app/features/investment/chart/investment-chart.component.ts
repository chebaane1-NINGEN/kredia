import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private readonly http = inject(HttpClient);

  selectedAssetSymbol = '';

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

  selectAsset(symbol: string): void {
    if (!symbol) return;
    
    this.selectedAssetSymbol = symbol;
    
    // Update asset name from market snapshots
    const asset = this.marketSnapshots.find(m => m.code === symbol);
    if (asset) {
      this.assetName = asset.label;
    }
    
    // Load chart data for this asset
    this.loadAssetChart(symbol);
  }

  private loadDashboard(): void {
    this.loading = true;

    const assets$ = this.assetVm.findAll().pipe(catchError(() => of([])));
    const positions$ = this.positionVm.findAll().pipe(catchError(() => of([])));
    const orders$ = this.orderVm.findAll().pipe(catchError(() => of([])));

    combineLatest([assets$, positions$, orders$]).subscribe({
      next: ([assets, positions, orders]) => {
        console.log('Assets from backend:', assets);
        console.log('Positions from backend:', positions);
        
        // Market snapshots from assets
        if (Array.isArray(assets) && assets.length > 0) {
          this.marketSnapshots = assets.slice(0, 4).map((a: any, i: number) => ({
            label: a.assetName ?? a.name ?? a.symbol,
            value: a.currentPrice != null ? `${a.currentPrice} EUR` : '-',
            change: a.change ?? '+0.00%',
            trend: (a.change && String(a.change).includes('-')) ? 'negative' : 'positive',
            code: String(a.symbol ?? a.id ?? i)
          }));
          
          // Initialize with first asset's data
          if (this.marketSnapshots.length > 0) {
            const firstAsset = this.marketSnapshots[0];
            this.assetName = firstAsset.label;
            this.assetPrice = parseFloat(String(firstAsset.value)) || 0;
          }
        }

        // Volume leaders from assets sorted by volume
        this.volumeLeaders = (Array.isArray(assets) ? assets : []).slice(0, 6).map((a: any) => ({
          name: a.assetName ?? a.name ?? a.symbol,
          symbol: a.symbol ?? 'NA',
          value: a.currentPrice != null ? `${a.currentPrice} EUR` : '-',
          change: a.change ?? '+0.00%',
          trend: (a.change && String(a.change).includes('-')) ? 'negative' : 'positive'
        }));

        // Volatile leaders from positions
        if (Array.isArray(positions) && positions.length > 0) {
          const byVol = positions.slice().sort((p1: any, p2: any) => Math.abs(p2.profitLossPercentage ?? 0) - Math.abs(p1.profitLossPercentage ?? 0));
          this.volatileLeaders = byVol.slice(0, 6).map((p: any) => ({
            name: p.assetSymbol ?? 'NA',
            symbol: p.assetSymbol ?? 'NA',
            value: p.currentMarketPrice != null ? `${p.currentMarketPrice} EUR` : '-',
            change: p.profitLossPercentage != null ? `${Number(p.profitLossPercentage).toFixed(2)}%` : '-',
            trend: (p.profitLossPercentage ?? 0) >= 0 ? 'positive' : 'negative'
          }));
        }

        // Initially load first asset's chart if available
        if (this.marketSnapshots.length > 0 && !this.selectedAssetSymbol) {
          this.loadAssetChart(this.marketSnapshots[0].code);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadAssetChart(symbol: string): void {
    if (!symbol) return;
    
    this.http.get<number[]>(`/api/investments/market/chart/${symbol}?range=1d&interval=1m`)
      .pipe(
        catchError((err) => {
          console.error('Error fetching chart:', err);
          this.prices = [];
          return of([]);
        })
      )
      .subscribe((data: number[]) => {
        if (data && data.length > 0) {
          this.prices = data;
          
          // Calculate price change from opening to closing
          const firstPrice = parseFloat(String(data[0]));
          const lastPrice = parseFloat(String(data[data.length - 1]));
          this.assetPrice = lastPrice;
          this.priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          // Update labels for x-axis
          this.labels = Array.from({ length: Math.min(10, data.length) }, (_, i) => 
            `${String(i * Math.floor(data.length / 10) || i).padStart(2, '0')}:00`
          );
        }
        this.cdr.markForCheck();
      });
  }

  get changeClass(): MarketTrend {
    return this.priceChange >= 0 ? 'positive' : 'negative';
  }

  get marketDirection(): string {
    return this.priceChange >= 0 ? 'En hausse' : 'En baisse';
  }

  get minPrice(): number {
    return this.prices.length > 0 ? Math.min(...this.prices) : 0;
  }

  get maxPrice(): number {
    return this.prices.length > 0 ? Math.max(...this.prices) : 1;
  }

  get svgPoints(): string {
    if (this.prices.length === 0) return '';
    
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
    if (this.prices.length === 0) return '';
    
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
    return this.prices.length > 1 ? 28 + (index * 1184) / (this.prices.length - 1) : 28;
  }

  getPointCy(price: number): number {
    if (this.prices.length === 0) return 420 - 28;
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
