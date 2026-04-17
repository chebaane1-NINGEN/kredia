import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { InvestmentAssetVm } from '../../vm/investment-asset.vm';
import { InvestmentAsset } from '../../models/investment-asset.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-asset-page.component.html',
  styleUrl: './investment-asset-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentAssetPageComponent implements OnInit {
  private readonly vm  = inject(InvestmentAssetVm);
  private readonly cdr = inject(ChangeDetectorRef);

  assets: InvestmentAsset[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.assets = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load investment assets.'; this.cdr.markForCheck(); }
      });
  }

  getTypeClass(type: string): string {
    return `type--${type.toLowerCase().replace('_', '-')}`;
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }
}
