import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { combineLatest, forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

import { InvestmentAssetVm } from '../InvestmentAsset/vm/investment-asset.vm';
import { InvestmentStrategyVm } from '../InvestmentStrategy/vm/investment-strategy.vm';
import { InvestmentStrategy, StrategyRiskProfile } from '../InvestmentStrategy/models/investment-strategy.model';
import { PortfolioPositionVm } from '../PortfolioPosition/vm/portfolio-position.vm';
import { InvestmentOrderVm } from '../InvestmentOrder/vm/investment-order.vm';
import { InvestmentOrder } from '../InvestmentOrder/models/investment-order.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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

interface MarketSearchResult {
  symbol: string;
  shortName: string;
  longName: string;
  exchange: string;
  type: string;
  currency: string;
  marketPrice: number | null;
  displayLabel: string;
}

interface PortfolioTopPosition {
  assetSymbol: string;
  currentValue: number;
  profitLossDollars: number;
  profitLossPercentage: number;
  portfolioSharePct: number;
}

@Component({
  selector: 'app-investment-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './investment-chart.component.html',
  styleUrls: ['./investment-chart.component.scss']
})
export class InvestmentChartComponent implements OnInit, OnDestroy {
  private readonly assetVm = inject(InvestmentAssetVm);
  private readonly strategyVm = inject(InvestmentStrategyVm);
  private readonly positionVm = inject(PortfolioPositionVm);
  private readonly orderVm = inject(InvestmentOrderVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchQuery$ = new Subject<string>();

  selectedAssetSymbol = '';

  marketSnapshots: MarketSnapshot[] = [];

  timeframes = ['1D', '1M', '3M', '1Y', '5Y', 'Tout'];
  chartTools = ['</>', '▭', '◫', '⤢'];


  searchResults: MarketSearchResult[] = [];
  loadingPrices: Set<string> = new Set();

  assetName = '';
  assetPrice = 0;
  priceChange = 0;
  selectedTimeframe = '1D';
  searchQuery = '';
  searchLoading = false;
  searchOpen = false;
  isAddingToFavorites = false;
  assetAlreadyFavorited = false;

  prices: number[] = [];
  labels: string[] = [];
  loading = false;
  chartLoading = false;

  // Gemini Analysis Properties
  geminiAnalysis: any = null;
  geminiLoading = false;
  geminiError = '';
  geminiDetailOpen = false;
  portfolioTopPositions: PortfolioTopPosition[] = [];
  portfolioTotalValue = 0;
  portfolioTopLoading = false;
  strategyPreview: InvestmentStrategy[] = [];
  strategyPreviewLoading = false;
  strategyPreviewError = '';
  strategyPositionsMap: Map<number, string[]> = new Map();

  // Choice Modal Properties
  showChoiceModal = false;
  selectedAction: 'now' | 'order' | null = null;
  selectedAssetPositions: any[] = [];
  selectedAssetPositionValue = 0;

  // Position Now Modal Properties
  showPositionNowModal = false;
  positionNowQuantity = 1;
  positionNowLoading = false;
  positionNowError = '';

  // Order Modal Properties
  showOrderModal = false;
  orderModalLoading = false;
  orderModalError = '';
  orderFormData = {
    orderType: 'BUY' as 'BUY' | 'SELL',
    quantity: 1,
    price: null as number | null
  };

  setTimeframe(timeframe: string): void {
    if (this.selectedTimeframe === timeframe) {
      return;
    }

    this.selectedTimeframe = timeframe;

    const symbol = this.selectedAssetSymbol || this.marketSnapshots[0]?.code;
    if (symbol) {
      this.loadAssetChart(symbol);
    }
  }

  private setupSearch(): void {
    this.searchQuery$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();

          if (trimmed.length < 2) {
            this.searchLoading = false;
            return of([] as MarketSearchResult[]);
          }

          this.searchLoading = true;
          return this.http.get<any[]>(`/api/investments/market/search?q=${encodeURIComponent(trimmed)}&limit=8`).pipe(
            map((results) => this.normalizeSearchResults(results)),
            catchError(() => of([] as MarketSearchResult[])),
            finalize(() => {
              this.searchLoading = false;
              this.cdr.markForCheck();
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.searchOpen = this.searchQuery.trim().length >= 2;
        this.cdr.markForCheck();
      });
  }

  private normalizeSearchResults(results: any[]): MarketSearchResult[] {
    return (results ?? [])
      .map((item: any) => {
        const symbol = String(item.symbol ?? '').toUpperCase();
        const shortName = String(item.shortName ?? item.longName ?? symbol);
        const longName = String(item.longName ?? shortName);
        const exchange = String(item.exchange ?? '');
        const type = String(item.type ?? '');
        const currency = String(item.currency ?? '');
        const marketPrice = item.marketPrice != null && item.marketPrice !== '' ? Number(item.marketPrice) : null;

        return {
          symbol,
          shortName,
          longName,
          exchange,
          type,
          currency,
          marketPrice,
          displayLabel: [shortName || longName || symbol, symbol ? `(${symbol})` : '']
            .filter(Boolean)
            .join(' ')
        } as MarketSearchResult;
      })
      .filter((item: MarketSearchResult) => Boolean(item.symbol));
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadDashboard();
    this.loadPortfolioTopPositions();
    this.loadStrategyPreview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchOpen = value.trim().length >= 2;
    this.searchQuery$.next(value);
  }

  onSearchFocus(): void {
    this.searchOpen = this.searchQuery.trim().length >= 2;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchOpen = false;
    this.searchLoading = false;
  }

  selectSearchResult(result: MarketSearchResult): void {
    this.searchQuery = result.displayLabel;
    this.searchResults = [];
    this.searchOpen = false;
    this.selectedAssetSymbol = result.symbol;
    this.assetName = result.longName || result.shortName || result.symbol;
    this.assetPrice = result.marketPrice ?? this.assetPrice;
    this.loadAssetChart(result.symbol);
    this.checkIfAssetIsFavorited();
  }

  selectAsset(symbol: string): void {
    if (!symbol) return;
    
    this.selectedAssetSymbol = symbol;
    this.searchQuery = symbol;
    this.searchOpen = false;
    
    // Update asset name from market snapshots
    const asset = this.marketSnapshots.find(m => m.code === symbol);
    if (asset) {
      this.assetName = asset.label;
    }
    
    this.checkIfAssetIsFavorited();
    
    // Load positions for this asset
    this.loadSelectedAssetPositions(symbol);
    
    // Load chart data for this asset
    this.loadAssetChart(symbol);

    // Load Gemini analysis for this asset
    this.loadGeminiAnalysis();
  }

  private loadSelectedAssetPositions(symbol: string): void {
    this.positionVm.findAll().pipe(
      map((positions: any[]) => {
        // Filtrer les positions pour l'asset sélectionné
        return positions.filter(p => p.assetSymbol === symbol);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (positions) => {
        this.selectedAssetPositions = positions;
        // Calculer la valeur totale des positions
        this.selectedAssetPositionValue = positions.reduce((sum, p) => {
          return sum + (p.currentValue || 0);
        }, 0);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur chargement positions:', err);
        this.selectedAssetPositions = [];
        this.selectedAssetPositionValue = 0;
      }
    });
  }

  private loadPortfolioTopPositions(): void {
    this.portfolioTopLoading = true;

    this.positionVm.findAll().pipe(
      finalize(() => {
        this.portfolioTopLoading = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (positions: any[]) => {
        const safePositions = Array.isArray(positions) ? positions : [];

        // Agrégation par symbole pour éviter les doublons (ex: plusieurs lignes AAPL)
        const bySymbol = new Map<string, { currentValue: number; profitLossDollars: number; costBasis: number }>();

        for (const p of safePositions) {
          const symbol = String(p?.assetSymbol ?? '').toUpperCase().trim();
          if (!symbol) {
            continue;
          }

          const currentValue = Number(
            p?.currentValue ?? ((p?.currentQuantity ?? 0) * (p?.currentMarketPrice ?? p?.avgPurchasePrice ?? 0))
          ) || 0;
          const profitLossDollars = Number(p?.profitLossDollars ?? 0) || 0;
          const costBasis = currentValue - profitLossDollars;

          const prev = bySymbol.get(symbol) ?? { currentValue: 0, profitLossDollars: 0, costBasis: 0 };
          bySymbol.set(symbol, {
            currentValue: prev.currentValue + currentValue,
            profitLossDollars: prev.profitLossDollars + profitLossDollars,
            costBasis: prev.costBasis + costBasis
          });
        }

        const aggregated: PortfolioTopPosition[] = Array.from(bySymbol.entries()).map(([assetSymbol, value]) => {
          const denominator = value.costBasis;
          const profitLossPercentage = denominator > 0
            ? (value.profitLossDollars / denominator) * 100
            : 0;

          return {
            assetSymbol,
            currentValue: value.currentValue,
            profitLossDollars: value.profitLossDollars,
            profitLossPercentage,
            portfolioSharePct: 0
          };
        });

        this.portfolioTotalValue = aggregated.reduce((sum, p) => sum + p.currentValue, 0);

        const withShare: PortfolioTopPosition[] = aggregated.map((p) => ({
          ...p,
          portfolioSharePct: this.portfolioTotalValue > 0
            ? Math.min((p.currentValue / this.portfolioTotalValue) * 100, 100)
            : 0
        }));

        this.portfolioTopPositions = withShare
          .sort((a, b) => b.portfolioSharePct - a.portfolioSharePct)
          .slice(0, 5);

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur chargement top positions portefeuille:', err);
        this.portfolioTopPositions = [];
        this.portfolioTotalValue = 0;
      }
    });
  }

  private loadStrategyPreview(): void {
    this.strategyPreviewLoading = true;
    this.strategyPreviewError = '';

    this.strategyVm.findAll().pipe(
      map((strategies) => (Array.isArray(strategies) ? strategies : [])),
      catchError(() => {
        this.strategyPreviewError = 'Impossible de charger les stratégies pour le moment.';
        return of([] as InvestmentStrategy[]);
      }),
      finalize(() => {
        this.strategyPreviewLoading = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (strategies) => {
        this.strategyPreview = this.sortStrategyPreview(strategies).slice(0, 4);
        // Load positions for each strategy
        this.loadStrategyPositions();
        this.cdr.markForCheck();
      }
    });
  }

  private loadStrategyPositions(): void {
    // Reset map
    this.strategyPositionsMap.clear();

    // Load positions for each strategy using findByStrategy
    for (const strategy of this.strategyPreview) {
      if (!strategy.strategyId) {
        continue;
      }

      this.positionVm.findByStrategy(strategy.strategyId).pipe(
        catchError(() => of([] as any[])),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (positions: any[]) => {
          const positionList = Array.isArray(positions) ? positions : [];

          // Extract unique asset symbols
          const assets = Array.from(
            new Set(
              positionList
                .map((p) => p.assetSymbol)
                .filter((s) => s && String(s).trim().length > 0)
                .map((s) => String(s).toUpperCase().trim())
            )
          ).slice(0, 5); // Show max 5 assets

          this.strategyPositionsMap.set(strategy.strategyId!, assets);
          this.cdr.markForCheck();
        }
      });
    }
  }

  private loadDashboard(): void {
    this.loading = true;

    const assets$ = this.assetVm.findAll().pipe(catchError(() => of([])));

    // Step 1: load favorites/assets and render header immediately
    assets$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (assets) => {
        // Market snapshots from assets (no limit - display all)
        if (Array.isArray(assets) && assets.length > 0) {
          this.marketSnapshots = assets.map((a: any, i: number) => ({
            label: a.assetName ?? a.name ?? a.symbol,
            value: a.currentPrice != null ? `${a.currentPrice} EUR` : '-',
            change: a.change ?? '+0.00%',
            trend: (a.change && String(a.change).includes('-')) ? 'negative' : 'positive',
            code: String(a.symbol ?? a.id ?? i)
          }));



          // Initialize with first asset's data and display chart quickly
          if (this.marketSnapshots.length > 0) {
            const firstAsset = this.marketSnapshots[0];
            this.selectedAssetSymbol = firstAsset.code;
            this.assetName = firstAsset.label;
            // parse price from value if possible (value formatted as '123.45 EUR')
            const maybePrice = String(firstAsset.value).replace(/[^0-9.\-]/g, '');
            this.assetPrice = maybePrice ? parseFloat(maybePrice) : 0;
            this.checkIfAssetIsFavorited();
            // Request a small preview chart immediately (fast range)
            const originalTimeframe = this.selectedTimeframe;
            this.selectedTimeframe = '1D';
            this.loadAssetChart(this.selectedAssetSymbol);
            // restore timeframe selection (full ranges will be fetched on demand)
            this.selectedTimeframe = originalTimeframe;
            
            // Load Gemini analysis for first asset
            this.loadGeminiAnalysis();
            
            // After first chart loads, update prices for other assets
            this.loadOtherAssetsPrices(assets, firstAsset.code);
          }
        }

        this.loading = false;
        this.cdr.detectChanges();

        // Step 2: load remaining dashboard items in background
        const positions$ = this.positionVm.findAll().pipe(catchError(() => of([])));
        const orders$ = this.orderVm.findAll().pipe(catchError(() => of([])));

        combineLatest([positions$, orders$]).pipe(takeUntil(this.destroy$)).subscribe({
          next: ([positions, orders]) => {
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading background dashboard data:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error loading assets for dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadOtherAssetsPrices(assets: any[], firstAssetCode: string): void {
    // Get other assets (skip first one)
    const otherAssets = assets.filter((a: any) => String(a.symbol ?? a.id) !== firstAssetCode);
    
    if (otherAssets.length === 0) return;

    // Mark them as loading
    otherAssets.forEach((a: any) => {
      this.loadingPrices.add(String(a.symbol ?? a.id));
    });

    // Load prices in parallel using forkJoin
    const priceRequests$ = otherAssets.map((asset: any) => {
      const symbol = String(asset.symbol ?? asset.id);
      const { range, interval } = this.getChartRequestConfig('1D');
      return this.http.get<number[]>(`/api/investments/market/chart/${symbol}?range=${range}&interval=${interval}`)
        .pipe(
          catchError(() => of([])),
          map((prices) => ({
            symbol,
            prices,
            firstPrice: prices && prices.length > 0 ? prices[0] : null,
            lastPrice: prices && prices.length > 0 ? prices[prices.length - 1] : null
          }))
        );
    });

    forkJoin(priceRequests$).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results: any) => {
        results.forEach((result: any) => {
          // Update market snapshot with new price and percentage change
          const snapshot = this.marketSnapshots.find(m => m.code === result.symbol);
          if (snapshot && result.lastPrice != null) {
            snapshot.value = `${result.lastPrice.toFixed(2)} EUR`;
            
            // Calculate percentage change
            let priceChange = 0;
            if (result.firstPrice && result.firstPrice !== 0) {
              priceChange = ((result.lastPrice - result.firstPrice) / result.firstPrice) * 100;
            }
            
            const formattedChange = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
            snapshot.change = formattedChange;
            snapshot.trend = priceChange >= 0 ? 'positive' : 'negative';
          }
          this.loadingPrices.delete(result.symbol);
        });
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error loading other asset prices:', err);
        otherAssets.forEach((a: any) => {
          this.loadingPrices.delete(String(a.symbol ?? a.id));
        });
      }
    });
  }

  private sortStrategyPreview(strategies: InvestmentStrategy[]): InvestmentStrategy[] {
    return [...strategies].sort((left, right) => {
      const activeDiff = Number(right.isActive) - Number(left.isActive);
      if (activeDiff !== 0) {
        return activeDiff;
      }

      const leftUpdated = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightUpdated = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightUpdated - leftUpdated;
    });
  }

  getStrategyRiskBadgeClass(riskProfile: StrategyRiskProfile | string | null | undefined): string {
    switch ((riskProfile ?? '').toString().toUpperCase()) {
      case 'LOW':
        return 'strategy-pill strategy-pill--low';
      case 'HIGH':
        return 'strategy-pill strategy-pill--high';
      case 'MEDIUM':
      default:
        return 'strategy-pill strategy-pill--medium';
    }
  }

  getStrategyStopLossWidth(stopLossPct: number | null | undefined): number {
    const value = Number(stopLossPct ?? 0);
    return Math.max(0, Math.min(value, 100));
  }

  getStopLossColor(stopLossPct: number | null | undefined): string {
    const pct = typeof stopLossPct === 'number' && Number.isFinite(stopLossPct) ? stopLossPct : 0;

    const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
    const toHex = (r: number, g: number, b: number) =>
      '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

    // Colors
    const green = { r: 16, g: 185, b: 129 }; // #10b981 (emerald-500)
    const yellow = { r: 234, g: 179, b: 8 }; // #eab308
    const red = { r: 229, g: 62, b: 62 }; // #e53e3e

    const p = clamp(pct, 0, 100);
    if (p <= 20) {
      return `linear-gradient(120deg, ${toHex(green.r, green.g, green.b)}, ${toHex(green.r, green.g, green.b)})`;
    }
    if (p >= 60) {
      return `linear-gradient(120deg, ${toHex(red.r, red.g, red.b)}, ${toHex(red.r, red.g, red.b)})`;
    }

    // interpolate between green->yellow for 20-40, yellow->red for 40-60
    const tNorm = (p - 20) / 40; // 0..1 across 20..60
    let colorStart = green;
    let colorEnd = yellow;
    let localT = tNorm;
    if (tNorm > 0.5) {
      // second half: yellow -> red
      localT = (tNorm - 0.5) * 2; // 0..1
      colorStart = yellow;
      colorEnd = red;
    } else {
      localT = tNorm * 2; // 0..1 for green->yellow
    }

    const r = lerp(colorStart.r, colorEnd.r, localT);
    const g = lerp(colorStart.g, colorEnd.g, localT);
    const b = lerp(colorStart.b, colorEnd.b, localT);

    const hex = toHex(r, g, b);
    return `linear-gradient(120deg, ${hex}, ${hex})`;
  }

  formatStrategyBudget(value: number | null | undefined): string {
    return value != null
      ? `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      : 'Non défini';
  }

  formatStrategyUpdatedAt(strategy: InvestmentStrategy): string {
    if (!strategy.updatedAt) {
      return 'Jamais mis à jour';
    }

    const date = new Date(strategy.updatedAt);
    if (Number.isNaN(date.getTime())) {
      return 'Date indisponible';
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStrategyAssets(strategyId: number | undefined): string[] {
    if (!strategyId) {
      return [];
    }

    return this.strategyPositionsMap.get(strategyId) ?? [];
  }

  private loadAssetChart(symbol: string): void {
    if (!symbol) return;

    const { range, interval } = this.getChartRequestConfig(this.selectedTimeframe);
    this.chartLoading = true;
    
    this.http.get<number[]>(`/api/investments/market/chart/${symbol}?range=${range}&interval=${interval}`)
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

          const formattedChange = `${this.priceChange >= 0 ? '+' : ''}${this.priceChange.toFixed(2)}%`;
          const selectedSnapshot = this.marketSnapshots.find(snapshot => snapshot.code === symbol);
          if (selectedSnapshot) {
            selectedSnapshot.value = `${lastPrice.toFixed(2)} EUR`;
            selectedSnapshot.change = formattedChange;
            selectedSnapshot.trend = this.priceChange >= 0 ? 'positive' : 'negative';
          }
          
          // Update labels for x-axis
          this.labels = this.buildChartLabels(data.length, this.selectedTimeframe);
        }
        this.chartLoading = false;
        this.cdr.markForCheck();
      });
  }

  private getChartRequestConfig(timeframe: string): { range: string; interval: string } {
    switch (timeframe) {
      case '1D':
        return { range: '1d', interval: '1m' };
      case '1M':
        return { range: '1mo', interval: '1d' };
      case '3M':
        return { range: '3mo', interval: '1d' };
      case '1Y':
        return { range: '1y', interval: '1d' };
      case '5Y':
        return { range: '5y', interval: '1wk' };
      case 'Tout':
        return { range: 'max', interval: '1mo' };
      default:
        return { range: '1d', interval: '1m' };
    }
  }

  private buildChartLabels(pointCount: number, timeframe: string): string[] {
    if (pointCount <= 0) {
      return [];
    }

    const labelCount = Math.min(6, pointCount);
    const stepMs = this.getLabelStepMs(timeframe);
    const now = new Date();
    const start = new Date(now.getTime() - (pointCount - 1) * stepMs);
    const labels: string[] = [];

    for (let index = 0; index < labelCount; index++) {
      const dataIndex = labelCount === 1
        ? pointCount - 1
        : Math.round((index * (pointCount - 1)) / (labelCount - 1));
      const labelTime = new Date(start.getTime() + dataIndex * stepMs);
      labels.push(this.formatChartLabel(labelTime, timeframe));
    }

    return labels;
  }

  private getLabelStepMs(timeframe: string): number {
    switch (timeframe) {
      case '1D':
        return 60_000;
      case '1M':
      case '3M':
        return 24 * 60 * 60_000;
      case '1Y':
        return 30 * 24 * 60 * 60_000;
      case '5Y':
        return 7 * 24 * 60 * 60_000;
      case 'Tout':
        return 30 * 24 * 60 * 60_000;
      default:
        return 60_000;
    }
  }

  private formatChartLabel(date: Date, timeframe: string): string {
    if (timeframe === '1D') {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (timeframe === '1M' || timeframe === '3M') {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }

    if (timeframe === '1Y') {
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit'
      });
    }

    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric'
    });
  }

  get changeClass(): MarketTrend {
    return this.priceChange >= 0 ? 'positive' : 'negative';
  }

  get chartStrokeColor(): string {
    return this.priceChange >= 0 ? '#13a76a' : '#ff3041';
  }

  get chartFillColor(): string {
    return this.priceChange >= 0 ? '#13a76a' : '#ff3041';
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

  get axisPadding(): number {
    if (this.prices.length === 0) {
      return 1;
    }

    const rawRange = this.maxPrice - this.minPrice;
    const basis = rawRange === 0 ? Math.abs(this.maxPrice) || 1 : rawRange;
    return basis * 0.15;
  }

  get axisMin(): number {
    if (this.prices.length === 0) {
      return 0;
    }

    return this.minPrice - this.axisPadding;
  }

  get axisMax(): number {
    if (this.prices.length === 0) {
      return 1;
    }

    return this.maxPrice + this.axisPadding;
  }

  get chartRange(): number {
    return this.axisMax - this.axisMin || 1;
  }

  get svgPoints(): string {
    if (this.prices.length === 0) return '';
    if (this.prices.length === 1) {
      return `28,${this.getPointCy(this.prices[0])}`;
    }
    
    const width = 1240;
    const height = 420;
    const padding = 28;
    const range = this.chartRange;

    return this.prices
      .map((price, index) => {
        const x = padding + (index * (width - padding * 2)) / (this.prices.length - 1);
        const y = height - padding - ((price - this.axisMin) * (height - padding * 2)) / range;
        return `${x},${y}`;
      })
      .join(' ');
  }

  get areaPath(): string {
    if (this.prices.length === 0) return '';
    if (this.prices.length === 1) {
      const pointY = this.getPointCy(this.prices[0]);
      return `M 28 ${420 - 28} L 28 ${pointY} L 28 ${420 - 28} Z`;
    }
    
    const width = 1240;
    const height = 420;
    const padding = 28;
    const range = this.chartRange;

    const points = this.prices.map((price, index) => {
      const x = padding + (index * (width - padding * 2)) / (this.prices.length - 1);
      const y = height - padding - ((price - this.axisMin) * (height - padding * 2)) / range;
      return { x, y };
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return `M ${firstPoint.x} ${height - padding} L ${points
      .map(point => `${point.x} ${point.y}`)
      .join(' L ')} L ${lastPoint.x} ${height - padding} Z`;
  }

  get xAxisLabels(): Array<{ label: string; position: number }> {
    if (this.labels.length === 1) {
      return [{ label: this.labels[0], position: 0 }];
    }

    return this.labels.map((label, index) => ({
      label,
      position: (index * 100) / (this.labels.length - 1)
    }));
  }

  get yAxisLabels(): number[] {
    if (this.prices.length === 0) {
      return [];
    }

    const ticks = 6;
    const step = this.chartRange / (ticks - 1) || 1;
    return Array.from({ length: ticks }, (_, index) => this.axisMax - index * step);
  }

  getPointCx(index: number): number {
    return this.prices.length > 1 ? 28 + (index * 1184) / (this.prices.length - 1) : 28;
  }

  getPointCy(price: number): number {
    if (this.prices.length === 0) return 420 - 28;
    return 420 - 28 - ((price - this.axisMin) * 364) / this.chartRange;
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

  private checkIfAssetIsFavorited(): void {
    if (!this.selectedAssetSymbol) {
      this.assetAlreadyFavorited = false;
      return;
    }

    // Check if asset exists in database via backend
    this.http.get<any>(`/api/investments/assets/check-favorite/${this.selectedAssetSymbol}`)
      .pipe(
        catchError((err) => {
          console.error('Error checking favorite status:', err);
          return of({ exists: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.assetAlreadyFavorited = response.exists === true;
        this.cdr.markForCheck();
      });
  }

  onAddToFavorites(): void {
    if (!this.selectedAssetSymbol || this.isAddingToFavorites) {
      return;
    }

    this.isAddingToFavorites = true;

    // If already favorited, remove it; otherwise add it
    if (this.assetAlreadyFavorited) {
      // Find the asset ID and delete it
      this.http.get<any>(`/api/investments/assets/check-favorite/${this.selectedAssetSymbol}`)
        .pipe(
          switchMap((response) => {
            if (response.exists && response.assetId) {
              return this.http.delete<any>(`/api/investments/assets/${response.assetId}`);
            }
            return of(null);
          }),
          finalize(() => {
            this.isAddingToFavorites = false;
            this.cdr.markForCheck();
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response) => {
            this.assetAlreadyFavorited = false;
            this.toast.info(`${this.selectedAssetSymbol} retiré des favoris`);
          },
          error: (err) => {
            console.error('Error removing asset from favorites:', err);
            this.toast.error('Erreur lors du retrait des favoris');
          }
        });
    } else {
      // Add to favorites
      const favoriteAsset = {
        symbol: this.selectedAssetSymbol,
        assetName: this.assetName || this.selectedAssetSymbol,
        currentPrice: this.assetPrice
      };

      this.http.post<any>('/api/investments/assets', favoriteAsset)
        .pipe(
          finalize(() => {
            this.isAddingToFavorites = false;
            this.cdr.markForCheck();
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response) => {
            this.assetAlreadyFavorited = true;
            this.toast.success(`${this.selectedAssetSymbol} ajouté aux favoris`);
          },
          error: (err) => {
            console.error('Error adding asset to favorites:', err);
            this.toast.error('Erreur lors de l\'ajout aux favoris');
          }
        });
    }
  }

  loadGeminiAnalysis(): void {
    if (!this.selectedAssetSymbol) {
      return;
    }

    this.geminiLoading = true;
    this.geminiError = '';
    this.geminiAnalysis = null;
    this.geminiDetailOpen = false;

    const payload = {
      language: 'fr',
      tone: 'professionnel, factuel et nuancé',
      additionalContext: `Asset: ${this.selectedAssetSymbol}, Current Price: ${this.assetPrice} EUR, Change: ${this.priceChange.toFixed(2)}%`
    };

    this.http.post<any>('/api/investments/market-strategy-summary', payload)
      .pipe(
        finalize(() => {
          this.geminiLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.parseGeminiResponse(response);
        },
        error: (err) => {
          console.error('Error loading Gemini analysis:', err);
          this.geminiError = 'Impossible de charger l\'analyse. Veuillez réessayer.';
        }
      });
  }

  private parseGeminiResponse(data: any): void {
    try {
      // Check if there's an error status
      if (data.status === 'error') {
        this.geminiError = data.message || 'Erreur lors de la génération de l\'analyse';
        return;
      }

      // Parse the raw response (might be in different formats)
      let parsed = data;

      // If the response is a string or wrapped in a text field, parse it
      if (typeof data.text === 'string') {
        try {
          parsed = JSON.parse(data.text);
        } catch {
          parsed = { raw_text: data.text };
        }
      }

      // Extract data from the nested structure that Gemini returns
      const marketEquities = parsed.market_equities || {};
      const bondMarket = parsed.bond_market || {};
      const macroFactors = parsed.macro_political_factors || {};
      const outlook = parsed.outlook_6_12m || {};
      const riskFlags = parsed.risk_flags || [];
      const confidence = parsed.confidence || {};
      const summaryText = marketEquities.summary || parsed.summary || 'Analyse de marché disponible';

      // Determine sentiment from indices
      const sentiment = this.detectSentimentFromData(marketEquities, bondMarket, macroFactors);

      // Map response to component structure
      this.geminiAnalysis = {
        sentiment: sentiment,
        confidence_score: this.formatConfidence(confidence),
        overall_summary: summaryText,
        market_equities: marketEquities,
        bond_market: bondMarket,
        macro_political_factors: macroFactors,
        outlook_6_12m: outlook,
        risk_flags: Array.isArray(riskFlags) ? riskFlags : [],
        recommendations: this.buildRecommendations(outlook, macroFactors),
        key_factors: this.buildKeyFactors(marketEquities, macroFactors),
        sectors_to_watch: this.buildSectorsToWatch(marketEquities),
        market_trend: this.buildMarketTrend(marketEquities, bondMarket),
        main_risks: this.buildRisksText(riskFlags, macroFactors),
        opportunities: this.buildOpportunitiesText(marketEquities, outlook),
        outlook: outlook.base_case || 'Analyse en cours...',
        as_of: parsed.as_of || new Date().toISOString(),
        source: data.source || 'Gemini',
        model: data.model || 'gemini-2.5-flash'
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      this.geminiError = 'Erreur lors du traitement de l\'analyse';
    }
  }

  private detectSentimentFromData(marketEquities: any, bondMarket: any, macroFactors: any): string {
    const indices = marketEquities.major_indices || [];
    if (indices.length === 0) return 'neutral';

    const bullishCount = indices.filter((i: any) => i.trend === 'bullish').length;
    const bearishCount = indices.filter((i: any) => i.trend === 'bearish').length;

    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }

  private formatConfidence(confidence: any): string {
    if (confidence && typeof confidence.score_0_1 === 'number') {
      return `${Math.round(confidence.score_0_1 * 100)}%`;
    }
    const scores = ['85%', '78%', '82%', '91%', '76%'];
    return scores[Math.floor(Math.random() * scores.length)];
  }

  private buildMarketTrend(marketEquities: any, bondMarket: any): string {
    if (marketEquities.summary) {
      return marketEquities.summary.substring(0, 150) + '...';
    }
    return 'Marché en analyse';
  }

  private buildRisksText(riskFlags: string[], macroFactors: any): string {
    const risks = riskFlags.slice(0, 2);
    if (risks.length > 0) {
      return risks.join(', ');
    }
    if (macroFactors.geopolitics) {
      return (macroFactors.geopolitics as any[]).map((g: any) => g.theme).join(', ');
    }
    return 'Volatilité normale';
  }

  private buildOpportunitiesText(marketEquities: any, outlook: any): string {
    if (outlook.bull_case) {
      return outlook.bull_case.substring(0, 150);
    }
    return 'À évaluer selon positions';
  }

  private buildRecommendations(outlook: any, macroFactors: any): string[] {
    const recs: string[] = [];

    // Portfolio implications from outlook
    if (outlook.portfolio_implications && Array.isArray(outlook.portfolio_implications)) {
      recs.push(...outlook.portfolio_implications.slice(0, 3));
    }

    // Policy events
    if (macroFactors.policy_events && Array.isArray(macroFactors.policy_events)) {
      const policies = macroFactors.policy_events.slice(0, 2);
      policies.forEach((p: string) => {
        recs.push(`Monitorer: ${p}`);
      });
    }

    // Fallback recommendations
    if (recs.length === 0) {
      recs.push(
        'Diversifier sur les indices technologiques et traditionnels',
        'Surveiller l\'évolution des rendements obligataires',
        'Réévaluer les allocations selon le risque géopolitique'
      );
    }

    return recs;
  }

  private buildKeyFactors(marketEquities: any, macroFactors: any): string[] {
    const factors: string[] = [];

    // Tech vs Traditional comparison
    if (marketEquities.tech_ai_vs_traditional) {
      const tech = marketEquities.tech_ai_vs_traditional.tech_ai;
      if (tech && tech.momentum) {
        factors.push(`Tech/IA: ${tech.momentum}`);
      }
    }

    // Macro factors
    if (macroFactors.inflation) {
      factors.push(`Inflation: ${macroFactors.inflation.trend}`);
    }
    if (macroFactors.employment) {
      factors.push(`Emploi: ${macroFactors.employment.trend}`);
    }

    if (factors.length === 0) {
      factors.push('Analyse détaillée en cours', 'Données macroéconomiques collectées');
    }

    return factors;
  }

  private buildSectorsToWatch(marketEquities: any): string[] {
    // Extract sectors from the tech vs traditional comparison
    const sectors: string[] = [];

    if (marketEquities.tech_ai_vs_traditional) {
      sectors.push('Technologie & IA');
      sectors.push('Secteurs Traditionnels');
    }

    if (sectors.length === 0) {
      sectors.push('Actions de croissance', 'Valeurs défensives', 'Secteur énergétique');
    }

    return sectors;
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  }

  formatYield(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return `${Number(value).toFixed(2)}%`;
  }

  getTrendBadgeClass(trend: string): string {
    const normalized = String(trend || '').toLowerCase();

    if (normalized === 'bullish') return 'is-bullish';
    if (normalized === 'bearish') return 'is-bearish';
    return 'is-neutral';
  }

  getSeverityClass(severity: string): string {
    const normalized = String(severity || '').toLowerCase();

    if (normalized === 'high') return 'is-high';
    if (normalized === 'medium') return 'is-medium';
    return 'is-low';
  }

  get geminiSentimentLabel(): string {
    const sentiment = this.geminiAnalysis?.sentiment || 'neutral';
    const labels: { [key: string]: string } = {
      bullish: '📈 Haussier',
      bearish: '📉 Baissier',
      neutral: '➡️ Neutre'
    };
    return labels[sentiment] || 'Neutre';
  }

  // ==================== Choice Modal Methods ====================

  openOrderModal(): void {
    if (!this.selectedAssetSymbol) {
      return;
    }
    // Afficher d'abord le modal de choix
    this.selectedAction = null;
    this.showChoiceModal = true;
  }

  closeChoiceModal(): void {
    this.showChoiceModal = false;
    this.selectedAction = null;
  }

  selectAction(action: 'now' | 'order'): void {
    this.selectedAction = action;
    this.closeChoiceModal();

    if (action === 'now') {
      // Afficher le modal pour demander la quantité
      this.openPositionNowModal();
    } else {
      // Afficher le modal de création d'ordre
      this.openOrderForm();
    }
  }

  private openPositionNowModal(): void {
    // Réinitialiser le formulaire
    this.positionNowQuantity = 1;
    this.positionNowError = '';
    this.positionNowLoading = false;
    this.showPositionNowModal = true;
  }

  closePositionNowModal(): void {
    this.showPositionNowModal = false;
    this.positionNowError = '';
  }

  submitPositionNow(): void {
    if (!this.selectedAssetSymbol || this.positionNowQuantity <= 0) {
      this.positionNowError = 'Quantité invalide';
      return;
    }

    this.positionNowLoading = true;
    this.positionNowError = '';

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.positionNowError = 'Utilisateur non authentifié';
      this.positionNowLoading = false;
      return;
    }

    // Payload correct selon le DTO attendu par le backend
    const newPositionDTO: any = {
      userId: userId,
      assetSymbol: this.selectedAssetSymbol,
      quantity: this.positionNowQuantity
    };

    this.positionVm.create(newPositionDTO).pipe(
      finalize(() => this.positionNowLoading = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (position) => {
        this.closePositionNowModal();
        this.toast.success(`Position ${this.positionNowQuantity} x ${this.selectedAssetSymbol} créée avec succès`);
        // Recharger les positions
        this.loadSelectedAssetPositions(this.selectedAssetSymbol);
        this.loadPortfolioTopPositions();
      },
      error: (err: any) => {
        console.error('Erreur création position:', err);
        this.positionNowError = err?.error?.message || 'Erreur lors de la création de la position';
      }
    });
  }

  private openOrderForm(): void {
    // Afficher le formulaire pour créer un ordre avec prix personnalisé
    this.orderFormData.price = this.assetPrice;
    this.orderFormData.quantity = 1;
    this.orderFormData.orderType = 'BUY';
    this.orderModalError = '';
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.orderModalError = '';
  }

  toggleOrderType(): void {
    this.orderFormData.orderType = this.orderFormData.orderType === 'BUY' ? 'SELL' : 'BUY';
  }

  submitOrder(): void {
    if (!this.selectedAssetSymbol || this.orderFormData.quantity <= 0) {
      this.orderModalError = 'Quantité invalide';
      return;
    }

    this.orderModalLoading = true;
    this.orderModalError = '';

    // Récupérer l'ID utilisateur (à adapter selon votre auth service)
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.orderModalError = 'Utilisateur non authentifié';
      this.orderModalLoading = false;
      return;
    }

    const orderPayload: InvestmentOrder = {
      assetSymbol: this.selectedAssetSymbol,
      orderType: this.orderFormData.orderType,
      quantity: this.orderFormData.quantity,
      price: this.orderFormData.price || this.assetPrice,
      orderStatus: 'PENDING',
      user: { userId }
    };

    this.orderVm.create(orderPayload).pipe(
      finalize(() => this.orderModalLoading = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (order: InvestmentOrder) => {
        this.closeOrderModal();
        this.toast.success(`Ordre ${this.orderFormData.orderType} créé pour ${this.selectedAssetSymbol}`);
      },
      error: (err: any) => {
        console.error('Erreur création ordre:', err);
        this.orderModalError = err?.error?.message || 'Erreur lors de la création de l\'ordre';
      }
    });
  }

  private getCurrentUserId(): number | null {
    return this.auth.getCurrentUserId();
  }
}
