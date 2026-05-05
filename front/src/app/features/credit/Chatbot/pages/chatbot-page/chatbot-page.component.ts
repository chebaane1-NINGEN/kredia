import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, NgZone, OnDestroy
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ChatbotVm } from '../../vm/chatbot.vm';
import { ChatbotRecommendation } from '../../models/chatbot.model';

@Component({
  standalone: false,
  templateUrl: './chatbot-page.component.html',
  styleUrl: './chatbot-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotPageComponent implements OnDestroy {
  private readonly vm   = inject(ChatbotVm);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly fb   = inject(FormBuilder);
  private readonly zone = inject(NgZone);
  private readonly http = inject(HttpClient);

  // ── UI state ───────────────────────────────────────────
  loading    = false;
  error: string | null = null;
  response: ChatbotRecommendation | null = null;

  // ── Voice state ────────────────────────────────────────
  isRecording      = false;
  isTranscribing   = false;
  speechSupported  = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  voiceError: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  // ── Voice recording ────────────────────────────────────
  toggleVoice(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    this.voiceError = null;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      this.zone.run(() => {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          this.voiceError = 'Microphone access denied. Please allow microphone access in your browser settings.';
        } else if (err?.name === 'NotFoundError') {
          this.voiceError = 'No microphone found. Please connect a microphone and try again.';
        } else {
          this.voiceError = `Microphone error: ${err?.message ?? err}`;
        }
        this.cdr.markForCheck();
      });
      return;
    }

    // Pick the best supported format
    const mimeType = this.getSupportedMimeType();
    this.audioChunks = [];

    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : {});

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => this.handleRecordingStop();

    this.mediaRecorder.start(250); // collect chunks every 250ms

    this.zone.run(() => {
      this.isRecording = true;
      this.cdr.markForCheck();
    });
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.zone.run(() => {
      this.isRecording = false;
      this.cdr.markForCheck();
    });
  }

  private handleRecordingStop(): void {
    if (this.audioChunks.length === 0) return;

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.audioChunks = [];

    this.zone.run(() => {
      this.isTranscribing = true;
      this.voiceError = null;
      this.cdr.markForCheck();
    });

    const formData = new FormData();
    formData.append('audio', audioBlob, `recording.${this.getExtension(mimeType)}`);

    this.http.post<{ transcript?: string; warning?: string; error?: string }>(
      'http://localhost:8081/api/speech/transcribe',
      formData
    ).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isTranscribing = false;
          if (res.error) {
            this.voiceError = `Transcription failed: ${res.error}`;
          } else if (res.transcript) {
            const current = this.form.controls.description.value;
            const appended = current ? `${current} ${res.transcript}` : res.transcript;
            this.form.controls.description.setValue(appended);
          } else {
            this.voiceError = 'No speech detected. Please try again.';
          }
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isTranscribing = false;
          this.voiceError = 'Could not reach the transcription service. Please check your connection.';
          this.cdr.markForCheck();
        });
      }
    });
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
  }

  private getExtension(mimeType: string): string {
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'mp4';
    return 'webm';
  }

  ngOnDestroy(): void {
    this.stopRecording();
  }

  // ── Form submit ────────────────────────────────────────
  submit(): void {
    if (this.isRecording) { this.stopRecording(); }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please add a more detailed description.';
      this.cdr.markForCheck();
      return;
    }

    this.error    = null;
    this.response = null;
    this.loading  = true;
    this.cdr.markForCheck();

    const { description } = this.form.getRawValue();

    this.vm.recommendRepayment(description)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => {
          if (res?.error) { this.error = res.error; }
          else { this.response = res; }
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Request failed. Please check the backend connection.';
          this.cdr.markForCheck();
        }
      });
  }
}
