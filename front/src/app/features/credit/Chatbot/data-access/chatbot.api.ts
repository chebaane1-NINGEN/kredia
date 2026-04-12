import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ChatbotRecommendation } from '../models/chatbot.model';

@Injectable({ providedIn: 'root' })
export class ChatbotApi {
  constructor(private readonly http: HttpClient) {}

  recommendRepayment(description: string): Observable<ChatbotRecommendation> {
    return this.http
      .post<ChatbotRecommendation>(`${API_BASE_URL}/api/chatbot/recommend-repayment`, {
        description
      })
      .pipe(timeout(10000));
  }
}
