export type AssetCategory = 'STOCK' | 'CRYPTO' | 'BOND' | 'ETF' | 'COMMODITY';
export type AssetRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface InvestmentAsset {
  assetId: number;
  symbol: string;
  assetName: string;
  category: AssetCategory;
  riskLevel: AssetRiskLevel;
  createdAt?: string;
}
