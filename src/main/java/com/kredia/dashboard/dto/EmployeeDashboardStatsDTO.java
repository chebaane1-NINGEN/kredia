package com.kredia.dashboard.dto;

/**
 * Dashboard statistics DTO for EMPLOYEE roles (AGENT / AUDITOR).
 * Contains metrics about credits handled by this employee:
 * volume, approval/rejection counts, risk distribution,
 * and average decision turnaround time.
 */
public class EmployeeDashboardStatsDTO {

    private long totalHandledCredits;
    private long approvedCredits;
    private long rejectedCredits;
    private Double averageDecisionTimeDays;
    private long lowRiskCredits;
    private long mediumRiskCredits;
    private long highRiskCredits;

    public EmployeeDashboardStatsDTO() {}

    public long getTotalHandledCredits() { return totalHandledCredits; }
    public void setTotalHandledCredits(long v) { this.totalHandledCredits = v; }
    public long getApprovedCredits() { return approvedCredits; }
    public void setApprovedCredits(long v) { this.approvedCredits = v; }
    public long getRejectedCredits() { return rejectedCredits; }
    public void setRejectedCredits(long v) { this.rejectedCredits = v; }
    public Double getAverageDecisionTimeDays() { return averageDecisionTimeDays; }
    public void setAverageDecisionTimeDays(Double v) { this.averageDecisionTimeDays = v; }
    public long getLowRiskCredits() { return lowRiskCredits; }
    public void setLowRiskCredits(long v) { this.lowRiskCredits = v; }
    public long getMediumRiskCredits() { return mediumRiskCredits; }
    public void setMediumRiskCredits(long v) { this.mediumRiskCredits = v; }
    public long getHighRiskCredits() { return highRiskCredits; }
    public void setHighRiskCredits(long v) { this.highRiskCredits = v; }

    public static EmployeeDashboardStatsDTOBuilder builder() { return new EmployeeDashboardStatsDTOBuilder(); }

    public static class EmployeeDashboardStatsDTOBuilder {
        private EmployeeDashboardStatsDTO dto = new EmployeeDashboardStatsDTO();
        public EmployeeDashboardStatsDTOBuilder totalHandledCredits(long v) { dto.setTotalHandledCredits(v); return this; }
        public EmployeeDashboardStatsDTOBuilder approvedCredits(long v) { dto.setApprovedCredits(v); return this; }
        public EmployeeDashboardStatsDTOBuilder rejectedCredits(long v) { dto.setRejectedCredits(v); return this; }
        public EmployeeDashboardStatsDTOBuilder averageDecisionTimeDays(Double v) { dto.setAverageDecisionTimeDays(v); return this; }
        public EmployeeDashboardStatsDTOBuilder lowRiskCredits(long v) { dto.setLowRiskCredits(v); return this; }
        public EmployeeDashboardStatsDTOBuilder mediumRiskCredits(long v) { dto.setMediumRiskCredits(v); return this; }
        public EmployeeDashboardStatsDTOBuilder highRiskCredits(long v) { dto.setHighRiskCredits(v); return this; }
        public EmployeeDashboardStatsDTO build() { return dto; }
    }
}
