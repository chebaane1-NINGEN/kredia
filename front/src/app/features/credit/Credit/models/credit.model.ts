export interface Credit {
  creditId?: number;
  userId?: number;
  amount: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths: number;
  repaymentType: 'AMORTISSEMENT_CONSTANT' | 'MENSUALITE_CONSTANTE' | 'IN_FINE';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  income: number;
  dependents: number;
}

export interface DefaultPredictionResponse {
  credit_id: number;
  default_probability: number;
  risk_label: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

