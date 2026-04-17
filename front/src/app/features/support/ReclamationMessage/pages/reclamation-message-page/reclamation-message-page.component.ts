import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ReclamationMessageVm } from '../../vm/reclamation-message.vm';
import { ReclamationMessage } from '../../models/reclamation-message.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reclamation-message-page.component.html',
  styleUrl: './reclamation-message-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationMessagePageComponent implements OnInit {
  private readonly vm  = inject(ReclamationMessageVm);
  private readonly cdr = inject(ChangeDetectorRef);

  messages: ReclamationMessage[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.messages = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load messages.'; this.cdr.markForCheck(); }
      });
  }

  getSenderClass(senderType: string): string {
    return `sender--${senderType.toLowerCase()}`;
  }
}
