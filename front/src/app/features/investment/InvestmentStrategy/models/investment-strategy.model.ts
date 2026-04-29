export interface InvestmentStrategy {
  strategyId: number;
  strategyName: string;
  maxBudget?: number | null;
  stopLossPct?: number | null;
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  autoCreateOrders: boolean;
  autoCreatePositions: boolean;
  maxAssets: number;
  reinvestProfits: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}
