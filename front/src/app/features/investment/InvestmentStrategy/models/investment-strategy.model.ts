export type StrategyRiskProfile = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InvestmentStrategyUser {
  userId?: number;
  id?: number;
}

export interface InvestmentStrategy {
  strategyId?: number;
  user?: InvestmentStrategyUser;
  strategyName: string;
  maxBudget?: number | null;
  stopLossPct?: number | null;
  riskProfile: StrategyRiskProfile;
  autoCreateOrders: boolean;
  autoCreatePositions: boolean;
  maxAssets: number;
  reinvestProfits: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}
