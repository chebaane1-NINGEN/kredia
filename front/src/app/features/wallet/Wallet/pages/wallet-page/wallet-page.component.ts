import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { WalletVm } from '../../vm/wallet.vm';
import { Wallet } from '../../models/wallet.model';
import { AuthService } from '../../../../../core/services/auth.service';

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
  readonly authService = inject(AuthService);

  wallets: Wallet[] = [];
  userWallet: Wallet | null = null;
  loading = false;
  error: string | null = null;
  walletNotFound = false;

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadWallets();
    } else if (this.authService.isClient()) {
      this.loadUserWallet();
    }
    // Agent: no loading needed, show static 0s
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

  loadUserWallet(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.loading = true;
    this.error = null;
    this.walletNotFound = false;
    this.cdr.markForCheck();

    this.vm.findByUser(userId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (wallet) => {
          this.userWallet = wallet;
          this.walletNotFound = !wallet;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Unable to load wallet.';
          this.cdr.markForCheck();
        }
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
