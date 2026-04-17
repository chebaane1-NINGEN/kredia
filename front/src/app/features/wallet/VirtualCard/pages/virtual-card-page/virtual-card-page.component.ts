import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { VirtualCardVm } from '../../vm/virtual-card.vm';
import { VirtualCard } from '../../models/virtual-card.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './virtual-card-page.component.html',
  styleUrl: './virtual-card-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualCardPageComponent implements OnInit {
  private readonly vm  = inject(VirtualCardVm);
  private readonly cdr = inject(ChangeDetectorRef);

  cards: VirtualCard[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.cards = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load virtual cards.'; this.cdr.markForCheck(); }
      });
  }

  block(id: number): void {
    this.vm.block(id).subscribe({
      next: (updated) => {
        this.cards = this.cards.map(c => c.cardId === id ? updated : c);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to block card #${id}.`; this.cdr.markForCheck(); }
    });
  }

  unblock(id: number): void {
    this.vm.unblock(id).subscribe({
      next: (updated) => {
        this.cards = this.cards.map(c => c.cardId === id ? updated : c);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to unblock card #${id}.`; this.cdr.markForCheck(); }
    });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }
}
