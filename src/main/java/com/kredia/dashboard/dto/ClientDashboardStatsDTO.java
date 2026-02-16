package com.kredia.dashboard.dto;

/**
 * Dashboard statistics DTO for CLIENT role.
 * Contains personal loan metrics: totals, approval rate, risk level,
 * and aggregated borrowing figures for the authenticated client.
 */
public class ClientDashboardStatsDTO {

    /** Total number of credit applications submitted by this client. */
    private long totalLoans;

    /** Number of approved credits. */
    private long approvedLoans;

    /** Number of rejected credits. */
    private long rejectedLoans;

    /** Sum of all approved loan amounts (in TND). */
    private Double totalBorrowedAmount;

    /** Average loan amount across all applications (in TND). */
    private Double averageLoanAmount;

    /** Approval rate as a percentage (0–100). */
    private Double approvalRate;

    /**
     * The client's most recent or dominant risk level (LOW, MEDIUM, HIGH,
     * VERY_HIGH).
     */
    private String riskLevel;

    public ClientDashboardStatsDTO() {}

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
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public static ClientDashboardStatsDTOBuilder builder() { return new ClientDashboardStatsDTOBuilder(); }

    public static class ClientDashboardStatsDTOBuilder {
        private ClientDashboardStatsDTO dto = new ClientDashboardStatsDTO();
        public ClientDashboardStatsDTOBuilder totalLoans(long v) { dto.setTotalLoans(v); return this; }
        public ClientDashboardStatsDTOBuilder approvedLoans(long v) { dto.setApprovedLoans(v); return this; }
        public ClientDashboardStatsDTOBuilder rejectedLoans(long v) { dto.setRejectedLoans(v); return this; }
        public ClientDashboardStatsDTOBuilder totalBorrowedAmount(Double v) { dto.setTotalBorrowedAmount(v); return this; }
        public ClientDashboardStatsDTOBuilder averageLoanAmount(Double v) { dto.setAverageLoanAmount(v); return this; }
        public ClientDashboardStatsDTOBuilder approvalRate(Double v) { dto.setApprovalRate(v); return this; }
        public ClientDashboardStatsDTOBuilder riskLevel(String v) { dto.setRiskLevel(v); return this; }
        public ClientDashboardStatsDTO build() { return dto; }
    }
}
