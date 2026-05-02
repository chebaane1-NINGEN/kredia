import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, NgZone, OnDestroy
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatbotVm } from '../../vm/chatbot.vm';
import { ChatbotRecommendation } from '../../models/chatbot.model';

// ── Déclaration Web Speech API ──────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Component({
  standalone: false,
  templateUrl: './chatbot-page.component.html',
  styleUrl: './chatbot-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotPageComponent implements OnDestroy {
  private readonly vm = inject(ChatbotVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly zone = inject(NgZone);

  // ── État UI ────────────────────────────────────────────
  loading = false;
  error: string | null = null;
  response: ChatbotRecommendation | null = null;

  // ── État vocal ─────────────────────────────────────────
  isRecording = false;
  speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  voiceError: string | null = null;
  interimText = '';
  private recognition: any = null;

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  // ── Reconnaissance vocale ──────────────────────────────
  toggleVoice(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.voiceError = null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.voiceError = 'La reconnaissance vocale n\'est pas supportée par votre navigateur (utilisez Chrome/Edge).';
      this.cdr.markForCheck();
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'fr-FR';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.zone.run(() => {
        this.isRecording = true;
        this.interimText = '';
        this.cdr.markForCheck();
      });
    };

    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        let finalText = this.form.controls.description.value;
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += (finalText ? ' ' : '') + transcript.trim();
          } else {
            interim += transcript;
          }
        }

        this.form.controls.description.setValue(finalText);
        this.interimText = interim;
        this.cdr.markForCheck();
      });
    };

    this.recognition.onerror = (event: any) => {
      this.zone.run(() => {
        this.isRecording = false;
        this.interimText = '';
        if (event.error === 'not-allowed') {
          this.voiceError = 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.';
        } else if (event.error === 'no-speech') {
          this.voiceError = 'Aucune parole détectée. Réessayez.';
        } else {
          this.voiceError = `Erreur microphone : ${event.error}`;
        }
        this.cdr.markForCheck();
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isRecording = false;
        this.interimText = '';
        this.cdr.markForCheck();
      });
    };

    try {
      this.recognition.start();
    } catch {
      this.voiceError = 'Impossible de démarrer la reconnaissance vocale.';
      this.cdr.markForCheck();
    }
  }

  private stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  ngOnDestroy(): void {
    this.recognition?.stop();
  }

  // ── Envoi du formulaire ────────────────────────────────
  submit(): void {
    if (this.isRecording) { this.stopRecording(); }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Ajoutez une description plus détaillée.';
      this.cdr.markForCheck();
      return;
    }

    this.error = null;
    this.response = null;
    this.loading = true;
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
          this.error = 'Erreur lors de la demande. Vérifiez le backend et le CORS.';
          this.cdr.markForCheck();
        }
      });
  }
}
