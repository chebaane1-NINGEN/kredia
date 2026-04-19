import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatbotApi } from '../data-access/chatbot.api';
import { ChatbotRecommendation } from '../models/chatbot.model';

/**
 * VM (Service) — couche données pour Chatbot.
 * Expose des Observables. Aucun état UI.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotVm {
  private readonly api = inject(ChatbotApi);

  recommendRepayment(description: string): Observable<ChatbotRecommendation> {
    return this.api.recommendRepayment(description);
  }
}
