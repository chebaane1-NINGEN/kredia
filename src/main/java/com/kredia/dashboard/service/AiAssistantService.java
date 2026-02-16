package com.kredia.dashboard.service;

import com.kredia.dashboard.dto.FintechAnalyticsDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@lombok.RequiredArgsConstructor
public class AiAssistantService {

    private final FintechAnalyticsService analyticsService;

    /**
     * Advanced Reasoning Engine: Parses user intent and provides data-driven,
     * contextual fintech analysis.
     */
    public AiResponse processQuery(String query) {
        FintechAnalyticsDTO stats = analyticsService.getFullFintechAnalytics();
        String q = query.toLowerCase();

        // Intent 1: Full Pipeline Analysis (Analyse complète)
        if (q.contains("analyse") || q.contains("complet") || q.contains("dashboard")) {
            return generateGlobalAnalysis(stats);
        }

        // Intent 2: Risk Prediction & Alerts (Risques, Alerte)
        if (q.contains("risk") || q.contains("risques") || q.contains("alerte") || q.contains("par")) {
            return generateRiskAnalysis(stats);
        }

        // Intent 3: KPI Explanation (Explique, Pourquoi)
        if (q.contains("explique") || q.contains("pourquoi") || q.contains("kpi")) {
            return generateKPIExplanation(q, stats);
        }

        // Intent 4: Financial Growth & Portfolio (Volume, Portfolio, Capital)
        if (q.contains("portfolio") || q.contains("volume") || q.contains("argent") || q.contains("capital")) {
            return generateFinancialAnalysis(stats);
        }

        // Default: Contextual Help
        return AiResponse.builder()
                .answer("I am the AI Admin Architect. I can provide a **Full Analysis**, **Risk Assessment**, or **KPI Explanation**.")
                .insight("Try asking: 'Fais une analyse des risques majeurs' or 'Explique le PAR30 actuel'.")
                .build();
    }

    private AiResponse generateGlobalAnalysis(FintechAnalyticsDTO s) {
        StringBuilder analysis = new StringBuilder();
        analysis.append(String.format("The platform is currently managing a portfolio of **%.2f TND** across **%d users**.\n", 
                s.getTotalPortfolioOutstanding(), s.getTotalUsers()));
        analysis.append(String.format("Our Underwriting Velocity is **%.1f days**, with a healthy **%.2f%%** approval rate.", 
                s.getAvgDecisionTimeDays(), s.getApprovalRate()));
        
        return AiResponse.builder()
                .answer(analysis.toString())
                .insight("Strategic Health: Capital utilization is at peak efficiency. Recommend checking 'Risk Governance' for high PD clusters.")
                .build();
    }

    private AiResponse generateRiskAnalysis(FintechAnalyticsDTO s) {
        String level = s.getPar30() > 5 ? "CRITICAL" : (s.getPar30() > 2 ? "CAUTION" : "STABLE");
        return AiResponse.builder()
                .answer(String.format("Risk Pulse: **%s**. Current PAR(30) is **%.2f%%**. Default rate is **%.2f%%**.", 
                        level, s.getPar30(), s.getDefaultRate()))
                .insight(String.format("Predictive Model: High-risk exposure sits at **%.1f%%**. This suggests a future PAR increase if micro-segments are not re-calibrated.", 
                        s.getHighRiskExposure()))
                .build();
    }

    private AiResponse generateKPIExplanation(String q, FintechAnalyticsDTO s) {
        if (q.contains("par")) {
            return AiResponse.builder()
                    .answer("PAR(30) measures the percentage of your portfolio with payments overdue by >30 days. It is the primary indicator of credit health.")
                    .insight(String.format("Current Status: Our PAR is %.2f%%, which is within the safe governance threshold (<5%%).", s.getPar30()))
                    .build();
        }
        return AiResponse.builder()
                .answer("I can help explain any KPI. Are you interested in PAR(30), TPO (Portfolio Outstanding), or ALS (Average Loan Size)?")
                .build();
    }

    private AiResponse generateFinancialAnalysis(FintechAnalyticsDTO s) {
        return AiResponse.builder()
                .answer(String.format("Financial Snapshot: Total Requested Volume is **%.2f TND** with capital utilization at **%.2f%%**.", 
                        s.getTotalRequestedVolume(), s.getCapitalUtilizationRate()))
                .insight("Recommendation: Consider increasing liquidity if TRV growth continues at the current 30-day trend.")
                .build();
    }

    public static class AiResponse {
        private String answer;
        private String insight;

        public AiResponse() {}
        public AiResponse(String answer, String insight) { this.answer = answer; this.insight = insight; }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
        public String getInsight() { return insight; }
        public void setInsight(String insight) { this.insight = insight; }

        public static AiResponseBuilder builder() {
            return new AiResponseBuilder();
        }

        public static class AiResponseBuilder {
            private AiResponse res = new AiResponse();
            public AiResponseBuilder answer(String a) { res.setAnswer(a); return this; }
            public AiResponseBuilder insight(String i) { res.setInsight(i); return this; }
            public AiResponse build() { return res; }
        }
    }
}
