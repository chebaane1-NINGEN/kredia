import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ReclamationHistoryVm } from '../../vm/reclamation-history.vm';
import { ReclamationHistory } from '../../models/reclamation-history.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reclamation-history-page.component.html',
  styleUrl: './reclamation-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationHistoryPageComponent implements OnInit {
  private readonly vm  = inject(ReclamationHistoryVm);
  private readonly cdr = inject(ChangeDetectorRef);

  history: ReclamationHistory[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.history = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load reclamation history.'; this.cdr.markForCheck(); }
      });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase().replace('_', '-')}`;
  }
}
