export interface PortfolioPosition {
  positionId: number;
  userId: number;
  assetSymbol: string;
  currentQuantity: number;
  avgPurchasePrice: number;
  currentMarketPrice?: number | null;
  currentValue?: number | null;
  profitLossDollars?: number | null;
  profitLossPercentage?: number | null;
  createdAt?: string;
}
