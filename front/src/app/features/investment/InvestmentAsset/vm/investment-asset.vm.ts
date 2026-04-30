import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvestmentAssetApi } from '../data-access/investment-asset.api';
import { InvestmentAsset } from '../models/investment-asset.model';

@Injectable({ providedIn: 'root' })
export class InvestmentAssetVm {
  private readonly api = inject(InvestmentAssetApi);

  findAll(): Observable<InvestmentAsset[]> {
    return this.api.findAll();
  }

  findById(id: number): Observable<InvestmentAsset> {
    return this.api.findById(id);
  }

  create(asset: Partial<InvestmentAsset>) {
    return this.api.create(asset);
  }

  update(id: number, asset: Partial<InvestmentAsset>) {
    return this.api.update(id, asset);
  }

  delete(id: number) {
    return this.api.delete(id);
  }
}
