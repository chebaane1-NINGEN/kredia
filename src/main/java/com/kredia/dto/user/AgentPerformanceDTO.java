package com.kredia.dto.user;

public class AgentPerformanceDTO {

    private Long agentId;
    private long approvalActionsCount;
    private long rejectionActionsCount;
    private long totalActions;
    private double performanceScore;
    private long numberOfClientsHandled;
    private long totalAssignedClients;
    private long activeAssignedClients;
    private double averageProcessingTimeSeconds;
    private double clientSatisfactionScore;

    public AgentPerformanceDTO() {}

    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }

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

    public long getTotalAssignedClients() { return totalAssignedClients; }
    public void setTotalAssignedClients(long totalAssignedClients) { this.totalAssignedClients = totalAssignedClients; }

    public long getActiveAssignedClients() { return activeAssignedClients; }
    public void setActiveAssignedClients(long activeAssignedClients) { this.activeAssignedClients = activeAssignedClients; }

    public double getAverageProcessingTimeSeconds() { return averageProcessingTimeSeconds; }
    public void setAverageProcessingTimeSeconds(double averageProcessingTimeSeconds) { this.averageProcessingTimeSeconds = averageProcessingTimeSeconds; }

    public double getClientSatisfactionScore() { return clientSatisfactionScore; }
    public void setClientSatisfactionScore(double clientSatisfactionScore) { this.clientSatisfactionScore = clientSatisfactionScore; }
}
