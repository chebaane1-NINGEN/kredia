import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { InvestmentAsset } from '../models/investment-asset.model';

@Injectable({ providedIn: 'root' })
export class InvestmentAssetApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<InvestmentAsset[]> {
    return this.http.get<InvestmentAsset[]>(`${API_BASE_URL}/api/investments/assets`);
  }

  findById(id: number): Observable<InvestmentAsset> {
    return this.http.get<InvestmentAsset>(`${API_BASE_URL}/api/investments/assets/${id}`);
  }

  create(asset: Partial<InvestmentAsset>) {
    return this.http.post<InvestmentAsset>(`${API_BASE_URL}/api/investments/assets`, asset);
  }

  update(id: number, asset: Partial<InvestmentAsset>) {
    return this.http.put<InvestmentAsset>(`${API_BASE_URL}/api/investments/assets/${id}`, asset);
  }

  delete(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/api/investments/assets/${id}`);
  }
}
