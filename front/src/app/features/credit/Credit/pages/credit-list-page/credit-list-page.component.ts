import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CreditApi } from '../../data-access/credit.api';
import { Credit } from '../../models/credit.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './credit-list-page.component.html',
  styleUrl: './credit-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditListPageComponent implements OnInit {
  private readonly api = inject(CreditApi);
  private readonly cdr = inject(ChangeDetectorRef);

  credits: Credit[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCredits();
  }

  loadCredits(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.findAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.credits = data || [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load credits', err);
          this.error = 'Impossible de charger la liste des crédits.';
          this.cdr.markForCheck();
        }
      });
  }

  downloadExcel(id: number): void {
    this.api.exportExcel(id).subscribe({
      next: (blob) => this.saveFile(blob, `credit_${id}.xlsx`),
      error: (err) => console.error('Excel download failed', err)
    });
  }

  downloadPdf(id: number): void {
    this.api.exportPdf(id).subscribe({
      next: (blob) => this.saveFile(blob, `statistiques_credit_${id}.pdf`),
      error: (err) => console.error('PDF download failed', err)
    });
  }

  private saveFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return `status--${status.toLowerCase()}`;
  }
}
