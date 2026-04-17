export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InvestmentStrategy {
  strategyId?: number;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  expectedReturn: number;
  minInvestment: number;
  isActive: boolean;
  createdAt?: string;
}
