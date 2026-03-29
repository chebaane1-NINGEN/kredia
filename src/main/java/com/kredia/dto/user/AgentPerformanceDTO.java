package com.kredia.dto.user;

public class AgentPerformanceDTO {

    private long approvalActionsCount;
    private long rejectionActionsCount;
    private long totalActions;
    private double performanceScore;
    private long numberOfClientsHandled;
    private double averageProcessingTimeSeconds;

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
}
