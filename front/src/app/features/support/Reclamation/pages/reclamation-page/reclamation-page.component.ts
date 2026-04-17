import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ReclamationVm } from '../../vm/reclamation.vm';
import { Reclamation } from '../../models/reclamation.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reclamation-page.component.html',
  styleUrl: './reclamation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationPageComponent implements OnInit {
  private readonly vm  = inject(ReclamationVm);
  private readonly cdr = inject(ChangeDetectorRef);

  reclamations: Reclamation[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.reclamations = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load reclamations.'; this.cdr.markForCheck(); }
      });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase().replace('_', '-')}`;
  }

  getCategoryClass(category: string): string {
    return `category--${category.toLowerCase()}`;
  }
}
