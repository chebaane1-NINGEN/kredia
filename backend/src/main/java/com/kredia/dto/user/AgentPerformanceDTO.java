package com.kredia.dto.user;

public class AgentPerformanceDTO {

    private long approvalActionsCount;
    private long rejectionActionsCount;
    private long totalActions;
    private double performanceScore;
    private long numberOfClientsHandled;
    private double averageProcessingTimeSeconds;
    private String scoreFormula;
    private String processingTimeFormula;
    private double approvalRate;
    private double rejectionRate;

    public AgentPerformanceDTO() {}

    public long getApprovalActionsCount() { return approvalActionsCount; }
    public void setApprovalActionsCount(long approvalActionsCount) { this.approvalActionsCount = approvalActionsCount; }

    public long getRejectionActionsCount() { return rejectionActionsCount; }
    public void setRejectionActionsCount(long rejectionActionsCount) { this.rejectionActionsCount = rejectionActionsCount; }

    public long getTotalActions() { return totalActions; }
    public void setTotalActions(long totalActions) { this.totalActions = totalActions; }

    public double getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(double performanceScore) { this.performanceScore = performanceScore; }

    public long getNumberOfClientsHandled() { return numberOfClientsHandled; }
    public void setNumberOfClientsHandled(long numberOfClientsHandled) { this.numberOfClientsHandled = numberOfClientsHandled; }

    public double getAverageProcessingTimeSeconds() { return averageProcessingTimeSeconds; }
    public void setAverageProcessingTimeSeconds(double averageProcessingTimeSeconds) { this.averageProcessingTimeSeconds = averageProcessingTimeSeconds; }

    public String getScoreFormula() { return scoreFormula; }
    public void setScoreFormula(String scoreFormula) { this.scoreFormula = scoreFormula; }

    public String getProcessingTimeFormula() { return processingTimeFormula; }
    public void setProcessingTimeFormula(String processingTimeFormula) { this.processingTimeFormula = processingTimeFormula; }

    public double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(double approvalRate) { this.approvalRate = approvalRate; }

    public double getRejectionRate() { return rejectionRate; }
    public void setRejectionRate(double rejectionRate) { this.rejectionRate = rejectionRate; }
}
