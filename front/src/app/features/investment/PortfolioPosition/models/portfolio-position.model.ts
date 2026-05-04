export interface PortfolioPosition {
  positionId?: number;
  userId: number;
  assetId: number;
  assetName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  updatedAt?: string;
}
