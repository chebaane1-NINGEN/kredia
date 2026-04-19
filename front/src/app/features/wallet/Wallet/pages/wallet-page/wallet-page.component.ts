import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { WalletVm } from '../../vm/wallet.vm';
import { Wallet } from '../../models/wallet.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-page.component.html',
  styleUrl: './wallet-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletPageComponent implements OnInit {
  private readonly vm  = inject(WalletVm);
  private readonly cdr = inject(ChangeDetectorRef);

  wallets: Wallet[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.wallets = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load wallets.'; this.cdr.markForCheck(); }
      });
  }

  freeze(id: number): void {
    this.vm.freeze(id).subscribe({
      next: (updated) => {
        this.wallets = this.wallets.map(w => w.walletId === id ? updated : w);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to freeze wallet #${id}.`; this.cdr.markForCheck(); }
    });
  }

  unfreeze(id: number): void {
    this.vm.unfreeze(id).subscribe({
      next: (updated) => {
        this.wallets = this.wallets.map(w => w.walletId === id ? updated : w);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to unfreeze wallet #${id}.`; this.cdr.markForCheck(); }
    });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }
}
