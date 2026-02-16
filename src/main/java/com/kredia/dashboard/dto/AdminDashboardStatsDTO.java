package com.kredia.dashboard.dto;

/**
 * Dashboard statistics DTO for ADMIN role.
 * Platform-wide overview: user counts, credit portfolio totals,
 * global approval rate, and portfolio-at-risk percentage.
 */
public class AdminDashboardStatsDTO {
    private long totalLoans;
    private long approvedLoans;
    private long rejectedLoans;
    private Double totalBorrowedAmount;
    private Double averageLoanAmount;
    private Double approvalRate;
    private long lowRiskUsers;
    private long mediumRiskUsers;
    private long highRiskUsers;
    private java.util.List<ChartPoint> loanVolumeTrend;
    private java.util.List<ChartPoint> approvalRateTrend;
    private java.util.List<ChartPoint> userGrowthTrend;

    public AdminDashboardStatsDTO() {}

    public long getTotalLoans() { return totalLoans; }
    public void setTotalLoans(long totalLoans) { this.totalLoans = totalLoans; }
    public long getApprovedLoans() { return approvedLoans; }
    public void setApprovedLoans(long approvedLoans) { this.approvedLoans = approvedLoans; }
    public long getRejectedLoans() { return rejectedLoans; }
    public void setRejectedLoans(long rejectedLoans) { this.rejectedLoans = rejectedLoans; }
    public Double getTotalBorrowedAmount() { return totalBorrowedAmount; }
    public void setTotalBorrowedAmount(Double totalBorrowedAmount) { this.totalBorrowedAmount = totalBorrowedAmount; }
    public Double getAverageLoanAmount() { return averageLoanAmount; }
    public void setAverageLoanAmount(Double averageLoanAmount) { this.averageLoanAmount = averageLoanAmount; }
    public Double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(Double approvalRate) { this.approvalRate = approvalRate; }
    public long getLowRiskUsers() { return lowRiskUsers; }
    public void setLowRiskUsers(long lowRiskUsers) { this.lowRiskUsers = lowRiskUsers; }
    public long getMediumRiskUsers() { return mediumRiskUsers; }
    public void setMediumRiskUsers(long mediumRiskUsers) { this.mediumRiskUsers = mediumRiskUsers; }
    public long getHighRiskUsers() { return highRiskUsers; }
    public void setHighRiskUsers(long highRiskUsers) { this.highRiskUsers = highRiskUsers; }
    public java.util.List<ChartPoint> getLoanVolumeTrend() { return loanVolumeTrend; }
    public void setLoanVolumeTrend(java.util.List<ChartPoint> loanVolumeTrend) { this.loanVolumeTrend = loanVolumeTrend; }
    public java.util.List<ChartPoint> getApprovalRateTrend() { return approvalRateTrend; }
    public void setApprovalRateTrend(java.util.List<ChartPoint> approvalRateTrend) { this.approvalRateTrend = approvalRateTrend; }
    public java.util.List<ChartPoint> getUserGrowthTrend() { return userGrowthTrend; }
    public void setUserGrowthTrend(java.util.List<ChartPoint> userGrowthTrend) { this.userGrowthTrend = userGrowthTrend; }

    public static AdminDashboardStatsDTOBuilder builder() { return new AdminDashboardStatsDTOBuilder(); }

    public static class AdminDashboardStatsDTOBuilder {
        private AdminDashboardStatsDTO dto = new AdminDashboardStatsDTO();
        public AdminDashboardStatsDTOBuilder totalLoans(long v) { dto.setTotalLoans(v); return this; }
        public AdminDashboardStatsDTOBuilder approvedLoans(long v) { dto.setApprovedLoans(v); return this; }
        public AdminDashboardStatsDTOBuilder rejectedLoans(long v) { dto.setRejectedLoans(v); return this; }
        public AdminDashboardStatsDTOBuilder totalBorrowedAmount(Double v) { dto.setTotalBorrowedAmount(v); return this; }
        public AdminDashboardStatsDTOBuilder averageLoanAmount(Double v) { dto.setAverageLoanAmount(v); return this; }
        public AdminDashboardStatsDTOBuilder approvalRate(Double v) { dto.setApprovalRate(v); return this; }
        public AdminDashboardStatsDTOBuilder lowRiskUsers(long v) { dto.setLowRiskUsers(v); return this; }
        public AdminDashboardStatsDTOBuilder mediumRiskUsers(long v) { dto.setMediumRiskUsers(v); return this; }
        public AdminDashboardStatsDTOBuilder highRiskUsers(long v) { dto.setHighRiskUsers(v); return this; }
        public AdminDashboardStatsDTOBuilder loanVolumeTrend(java.util.List<ChartPoint> v) { dto.setLoanVolumeTrend(v); return this; }
        public AdminDashboardStatsDTOBuilder approvalRateTrend(java.util.List<ChartPoint> v) { dto.setApprovalRateTrend(v); return this; }
        public AdminDashboardStatsDTOBuilder userGrowthTrend(java.util.List<ChartPoint> v) { dto.setUserGrowthTrend(v); return this; }
        public AdminDashboardStatsDTO build() { return dto; }
    }

    public static class ChartPoint {
        private String label;
        private Double value;
        public ChartPoint() {}
        public ChartPoint(String label, Double value) { this.label = label; this.value = value; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }
    }
}
