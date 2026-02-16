package com.kredia.dashboard.dto;

import java.util.List;
import java.util.Map;

public class FintechAnalyticsDTO {

    private long totalUsers;
    private Double kycApprovalRate;
    private Double blockedAccountRatio;
    private Double activeUserRate;
    private Double totalPortfolioOutstanding;
    private Double totalRequestedVolume;
    private Double approvalRate;
    private Double averageLoanSize;
    private Double capitalUtilizationRate;
    private Double par30;
    private Double defaultRate;
    private Double avgDecisionTimeDays;
    private Double highRiskExposure;
    private List<TimeSeriePoint> loanVolumeTrend;
    private List<TimeSeriePoint> approvalRateTrend;
    private List<TimeSeriePoint> par30Trend;
    private List<TimeSeriePoint> userGrowthTrend;

    public FintechAnalyticsDTO() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long v) { this.totalUsers = v; }
    public Double getKycApprovalRate() { return kycApprovalRate; }
    public void setKycApprovalRate(Double v) { this.kycApprovalRate = v; }
    public Double getBlockedAccountRatio() { return blockedAccountRatio; }
    public void setBlockedAccountRatio(Double v) { this.blockedAccountRatio = v; }
    public Double getActiveUserRate() { return activeUserRate; }
    public void setActiveUserRate(Double v) { this.activeUserRate = v; }
    public Double getTotalPortfolioOutstanding() { return totalPortfolioOutstanding; }
    public void setTotalPortfolioOutstanding(Double v) { this.totalPortfolioOutstanding = v; }
    public Double getTotalRequestedVolume() { return totalRequestedVolume; }
    public void setTotalRequestedVolume(Double v) { this.totalRequestedVolume = v; }
    public Double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(Double v) { this.approvalRate = v; }
    public Double getAverageLoanSize() { return averageLoanSize; }
    public void setAverageLoanSize(Double v) { this.averageLoanSize = v; }
    public Double getCapitalUtilizationRate() { return capitalUtilizationRate; }
    public void setCapitalUtilizationRate(Double v) { this.capitalUtilizationRate = v; }
    public Double getPar30() { return par30; }
    public void setPar30(Double v) { this.par30 = v; }
    public Double getDefaultRate() { return defaultRate; }
    public void setDefaultRate(Double v) { this.defaultRate = v; }
    public Double getAvgDecisionTimeDays() { return avgDecisionTimeDays; }
    public void setAvgDecisionTimeDays(Double v) { this.avgDecisionTimeDays = v; }
    public Double getHighRiskExposure() { return highRiskExposure; }
    public void setHighRiskExposure(Double v) { this.highRiskExposure = v; }
    public List<TimeSeriePoint> getLoanVolumeTrend() { return loanVolumeTrend; }
    public void setLoanVolumeTrend(List<TimeSeriePoint> v) { this.loanVolumeTrend = v; }
    public List<TimeSeriePoint> getApprovalRateTrend() { return approvalRateTrend; }
    public void setApprovalRateTrend(List<TimeSeriePoint> v) { this.approvalRateTrend = v; }
    public List<TimeSeriePoint> getPar30Trend() { return par30Trend; }
    public void setPar30Trend(List<TimeSeriePoint> v) { this.par30Trend = v; }
    public List<TimeSeriePoint> getUserGrowthTrend() { return userGrowthTrend; }
    public void setUserGrowthTrend(List<TimeSeriePoint> v) { this.userGrowthTrend = v; }

    public static FintechAnalyticsDTOBuilder builder() { return new FintechAnalyticsDTOBuilder(); }

    public static class FintechAnalyticsDTOBuilder {
        private FintechAnalyticsDTO dto = new FintechAnalyticsDTO();
        public FintechAnalyticsDTOBuilder totalUsers(long v) { dto.setTotalUsers(v); return this; }
        public FintechAnalyticsDTOBuilder kycApprovalRate(Double v) { dto.setKycApprovalRate(v); return this; }
        public FintechAnalyticsDTOBuilder blockedAccountRatio(Double v) { dto.setBlockedAccountRatio(v); return this; }
        public FintechAnalyticsDTOBuilder activeUserRate(Double v) { dto.setActiveUserRate(v); return this; }
        public FintechAnalyticsDTOBuilder totalPortfolioOutstanding(Double v) { dto.setTotalPortfolioOutstanding(v); return this; }
        public FintechAnalyticsDTOBuilder totalRequestedVolume(Double v) { dto.setTotalRequestedVolume(v); return this; }
        public FintechAnalyticsDTOBuilder approvalRate(Double v) { dto.setApprovalRate(v); return this; }
        public FintechAnalyticsDTOBuilder averageLoanSize(Double v) { dto.setAverageLoanSize(v); return this; }
        public FintechAnalyticsDTOBuilder capitalUtilizationRate(Double v) { dto.setCapitalUtilizationRate(v); return this; }
        public FintechAnalyticsDTOBuilder par30(Double v) { dto.setPar30(v); return this; }
        public FintechAnalyticsDTOBuilder defaultRate(Double v) { dto.setDefaultRate(v); return this; }
        public FintechAnalyticsDTOBuilder avgDecisionTimeDays(Double v) { dto.setAvgDecisionTimeDays(v); return this; }
        public FintechAnalyticsDTOBuilder highRiskExposure(Double v) { dto.setHighRiskExposure(v); return this; }
        public FintechAnalyticsDTOBuilder loanVolumeTrend(List<TimeSeriePoint> v) { dto.setLoanVolumeTrend(v); return this; }
        public FintechAnalyticsDTOBuilder approvalRateTrend(List<TimeSeriePoint> v) { dto.setApprovalRateTrend(v); return this; }
        public FintechAnalyticsDTOBuilder par30Trend(List<TimeSeriePoint> v) { dto.setPar30Trend(v); return this; }
        public FintechAnalyticsDTOBuilder userGrowthTrend(List<TimeSeriePoint> v) { dto.setUserGrowthTrend(v); return this; }
        public FintechAnalyticsDTO build() { return dto; }
    }

    public static class TimeSeriePoint {
        private String label;
        private Double value;

        public TimeSeriePoint() {}
        public TimeSeriePoint(String label, Double value) { this.label = label; this.value = value; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }
    }
}
