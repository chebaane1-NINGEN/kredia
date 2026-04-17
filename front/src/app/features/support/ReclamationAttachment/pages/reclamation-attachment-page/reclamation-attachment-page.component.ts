import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ReclamationAttachmentVm } from '../../vm/reclamation-attachment.vm';
import { ReclamationAttachment } from '../../models/reclamation-attachment.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reclamation-attachment-page.component.html',
  styleUrl: './reclamation-attachment-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationAttachmentPageComponent implements OnInit {
  private readonly vm  = inject(ReclamationAttachmentVm);
  private readonly cdr = inject(ChangeDetectorRef);

  attachments: ReclamationAttachment[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAttachments();
  }

  loadAttachments(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.attachments = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load attachments.'; this.cdr.markForCheck(); }
      });
  }

  delete(id: number): void {
    this.vm.delete(id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.attachmentId !== id);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to delete attachment #${id}.`; this.cdr.markForCheck(); }
    });
  }

  fileSizeLabel(bytes?: number): string {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
