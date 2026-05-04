export type AssetType = 'STOCK' | 'BOND' | 'CRYPTO' | 'REAL_ESTATE' | 'COMMODITY';
export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface InvestmentAsset {
  assetId?: number;
  name: string;
  symbol: string;
  assetType: AssetType;
  currentPrice: number;
  currency: string;
  status: AssetStatus;
  updatedAt?: string;
}
