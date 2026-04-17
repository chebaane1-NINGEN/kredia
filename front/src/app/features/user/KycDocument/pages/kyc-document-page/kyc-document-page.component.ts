import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { KycDocumentVm } from '../../vm/kyc-document.vm';
import { KycDocument } from '../../models/kyc-document.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-document-page.component.html',
  styleUrl: './kyc-document-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycDocumentPageComponent implements OnInit {
  private readonly vm  = inject(KycDocumentVm);
  private readonly cdr = inject(ChangeDetectorRef);

  docs: KycDocument[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDocs();
  }

  loadDocs(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.docs = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load KYC documents.'; this.cdr.markForCheck(); }
      });
  }

  approve(id: number): void {
    this.vm.approve(id).subscribe({
      next: (updated) => {
        this.docs = this.docs.map(d => d.docId === id ? updated : d);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to approve document #${id}.`; this.cdr.markForCheck(); }
    });
  }

  reject(id: number): void {
    this.vm.reject(id).subscribe({
      next: (updated) => {
        this.docs = this.docs.map(d => d.docId === id ? updated : d);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to reject document #${id}.`; this.cdr.markForCheck(); }
    });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }
}
