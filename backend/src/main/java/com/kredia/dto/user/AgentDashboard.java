package com.kredia.dto.user;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Comprehensive Agent Dashboard DTO with real-time KPIs, SLA tracking,
 * client risk scoring, and priority intelligence
 */
public class AgentDashboard {

    // Core Performance Metrics
    private double performanceScore; // (Approval Rate × 0.5) + (Client Handling Speed × 0.3) + (Activity Volume × 0.2)
    private double approvalRate; // Approvals / (Approvals + Rejections)
    private double efficiencyScore; // Clients handled / Total actions
    private double averageProcessingTime; // AVG(TIMESTAMPDIFF(SECOND, created_at, processed_at))

    // Activity Metrics
    private long totalActions;
    private long approvals;
    private long rejections;
    private long clientsHandled;
    private long pendingClients;

    // SLA Tracking
    private SLAMetrics slaMetrics;
    private String slaStatus; // "ON_TRACK", "AT_RISK", "BREACHED"
    private String slaColor; // Green, Yellow, Red

    // Client Risk Scoring
    private RiskMetrics riskMetrics;

    // Priority Intelligence
    private PriorityMetrics priorityMetrics;

    // Trend Data
    private List<PerformanceTrendPoint> weeklyTrend;
    private List<PerformanceTrendPoint> monthlyTrend;

    // Activity Timeline
    private List<ActivityGroup> recentActivities;

    // Insights & Recommendations
    private List<String> insights;
    private List<String> recommendations;

    // Metadata
    private long generatedAt;
    private String agentName;
    private long agentId;

    // Constructors
    public AgentDashboard() {
        this.generatedAt = System.currentTimeMillis();
    }

    public AgentDashboard(long agentId, String agentName) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.generatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public double getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(double performanceScore) { this.performanceScore = performanceScore; }

    public double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(double approvalRate) { this.approvalRate = approvalRate; }

    public double getEfficiencyScore() { return efficiencyScore; }
    public void setEfficiencyScore(double efficiencyScore) { this.efficiencyScore = efficiencyScore; }

    public double getAverageProcessingTime() { return averageProcessingTime; }
    public void setAverageProcessingTime(double averageProcessingTime) { this.averageProcessingTime = averageProcessingTime; }

    public long getTotalActions() { return totalActions; }
    public void setTotalActions(long totalActions) { this.totalActions = totalActions; }

    public long getApprovals() { return approvals; }
    public void setApprovals(long approvals) { this.approvals = approvals; }

    public long getRejections() { return rejections; }
    public void setRejections(long rejections) { this.rejections = rejections; }

    public long getClientsHandled() { return clientsHandled; }
    public void setClientsHandled(long clientsHandled) { this.clientsHandled = clientsHandled; }

    public long getPendingClients() { return pendingClients; }
    public void setPendingClients(long pendingClients) { this.pendingClients = pendingClients; }

    public SLAMetrics getSlaMetrics() { return slaMetrics; }
    public void setSlaMetrics(SLAMetrics slaMetrics) { this.slaMetrics = slaMetrics; }

    public String getSlaStatus() { return slaStatus; }
    public void setSlaStatus(String slaStatus) { this.slaStatus = slaStatus; }

    public String getSlaColor() { return slaColor; }
    public void setSlaColor(String slaColor) { this.slaColor = slaColor; }

    public RiskMetrics getRiskMetrics() { return riskMetrics; }
    public void setRiskMetrics(RiskMetrics riskMetrics) { this.riskMetrics = riskMetrics; }

    public PriorityMetrics getPriorityMetrics() { return priorityMetrics; }
    public void setPriorityMetrics(PriorityMetrics priorityMetrics) { this.priorityMetrics = priorityMetrics; }

    public List<PerformanceTrendPoint> getWeeklyTrend() { return weeklyTrend; }
    public void setWeeklyTrend(List<PerformanceTrendPoint> getWeeklyTrend) { this.weeklyTrend = getWeeklyTrend; }

    public List<PerformanceTrendPoint> getMonthlyTrend() { return monthlyTrend; }
    public void setMonthlyTrend(List<PerformanceTrendPoint> getMonthlyTrend) { this.monthlyTrend = getMonthlyTrend; }

    public List<ActivityGroup> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<ActivityGroup> recentActivities) { this.recentActivities = recentActivities; }

    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public long getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(long generatedAt) { this.generatedAt = generatedAt; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public long getAgentId() { return agentId; }
    public void setAgentId(long agentId) { this.agentId = agentId; }

    /**
     * Calculate comprehensive performance score
     */
    public void calculatePerformanceScore() {
        // Performance Score = (Approval Rate × 0.5) + (Client Handling Speed × 0.3) + (Activity Volume × 0.2)

        // Approval Rate component (0.5 weight)
        double approvalComponent = this.approvalRate * 0.5;

        // Client Handling Speed component (0.3 weight) - inverse of processing time
        // Higher speed (lower processing time) = higher score
        double speedComponent = 0;
        if (this.averageProcessingTime > 0) {
            // Normalize: faster processing (lower time) gets higher score
            // Assume 30 minutes (1800s) is baseline, score decreases as time increases
            double baselineTime = 1800.0; // 30 minutes
            double speedRatio = Math.max(0, baselineTime / this.averageProcessingTime);
            speedComponent = Math.min(100.0, speedRatio * 30.0); // Max 30 points for speed
        }

        // Activity Volume component (0.2 weight) - based on total actions
        double volumeComponent = Math.min(20.0, this.totalActions * 0.1); // Max 20 points for volume

        this.performanceScore = Math.round((approvalComponent + speedComponent + volumeComponent) * 100.0) / 100.0;
    }

    /**
     * Calculate efficiency score
     */
    public void calculateEfficiencyScore() {
        // Efficiency Score = Clients handled / Total actions
        if (this.totalActions > 0) {
            this.efficiencyScore = Math.round((this.clientsHandled * 100.0 / this.totalActions) * 100.0) / 100.0;
        } else {
            this.efficiencyScore = 0.0;
        }
    }

    /**
     * Update SLA status based on metrics
     */
    public void updateSLAStatus() {
        if (slaMetrics == null) return;

        double slaComplianceRate = slaMetrics.getComplianceRate();
        if (slaComplianceRate >= 95.0) {
            this.slaStatus = "ON_TRACK";
            this.slaColor = "#10B981"; // Green
        } else if (slaComplianceRate >= 85.0) {
            this.slaStatus = "AT_RISK";
            this.slaColor = "#F59E0B"; // Yellow
        } else {
            this.slaStatus = "BREACHED";
            this.slaColor = "#EF4444"; // Red
        }
    }

    /**
     * SLA Metrics nested class
     */
    public static class SLAMetrics {
        private double complianceRate; // Percentage of actions meeting SLA
        private long totalSLAActions;
        private long compliantActions;
        private long breachedActions;
        private double averageResponseTime; // in seconds
        private double targetResponseTime; // in seconds (SLA target)

        public SLAMetrics() {}

        public SLAMetrics(double complianceRate, long totalSLAActions, long compliantActions,
                         long breachedActions, double averageResponseTime, double targetResponseTime) {
            this.complianceRate = complianceRate;
            this.totalSLAActions = totalSLAActions;
            this.compliantActions = compliantActions;
            this.breachedActions = breachedActions;
            this.averageResponseTime = averageResponseTime;
            this.targetResponseTime = targetResponseTime;
        }

        // Getters and Setters
        public double getComplianceRate() { return complianceRate; }
        public void setComplianceRate(double complianceRate) { this.complianceRate = complianceRate; }

        public long getTotalSLAActions() { return totalSLAActions; }
        public void setTotalSLAActions(long totalSLAActions) { this.totalSLAActions = totalSLAActions; }

        public long getCompliantActions() { return compliantActions; }
        public void setCompliantActions(long compliantActions) { this.compliantActions = compliantActions; }

        public long getBreachedActions() { return breachedActions; }
        public void setBreachedActions(long breachedActions) { this.breachedActions = breachedActions; }

        public double getAverageResponseTime() { return averageResponseTime; }
        public void setAverageResponseTime(double averageResponseTime) { this.averageResponseTime = averageResponseTime; }

        public double getTargetResponseTime() { return targetResponseTime; }
        public void setTargetResponseTime(double targetResponseTime) { this.targetResponseTime = targetResponseTime; }
    }

    /**
     * Risk Metrics nested class
     */
    public static class RiskMetrics {
        private double averageClientRiskScore;
        private long highRiskClients;
        private long mediumRiskClients;
        private long lowRiskClients;
        private double riskDistributionIndex; // Measure of risk concentration

        public RiskMetrics() {}

        public RiskMetrics(double averageClientRiskScore, long highRiskClients,
                          long mediumRiskClients, long lowRiskClients, double riskDistributionIndex) {
            this.averageClientRiskScore = averageClientRiskScore;
            this.highRiskClients = highRiskClients;
            this.mediumRiskClients = mediumRiskClients;
            this.lowRiskClients = lowRiskClients;
            this.riskDistributionIndex = riskDistributionIndex;
        }

        // Getters and Setters
        public double getAverageClientRiskScore() { return averageClientRiskScore; }
        public void setAverageClientRiskScore(double averageClientRiskScore) { this.averageClientRiskScore = averageClientRiskScore; }

        public long getHighRiskClients() { return highRiskClients; }
        public void setHighRiskClients(long highRiskClients) { this.highRiskClients = highRiskClients; }

        public long getMediumRiskClients() { return mediumRiskClients; }
        public void setMediumRiskClients(long mediumRiskClients) { this.mediumRiskClients = mediumRiskClients; }

        public long getLowRiskClients() { return lowRiskClients; }
        public void setLowRiskClients(long lowRiskClients) { this.lowRiskClients = lowRiskClients; }

        public double getRiskDistributionIndex() { return riskDistributionIndex; }
        public void setRiskDistributionIndex(double riskDistributionIndex) { this.riskDistributionIndex = riskDistributionIndex; }
    }

    /**
     * Priority Metrics nested class
     */
    public static class PriorityMetrics {
        private long urgentClients;
        private long highPriorityClients;
        private long mediumPriorityClients;
        private long lowPriorityClients;
        private double priorityHandlingEfficiency;

        public PriorityMetrics() {}

        public PriorityMetrics(long urgentClients, long highPriorityClients,
                             long mediumPriorityClients, long lowPriorityClients,
                             double priorityHandlingEfficiency) {
            this.urgentClients = urgentClients;
            this.highPriorityClients = highPriorityClients;
            this.mediumPriorityClients = mediumPriorityClients;
            this.lowPriorityClients = lowPriorityClients;
            this.priorityHandlingEfficiency = priorityHandlingEfficiency;
        }

        // Getters and Setters
        public long getUrgentClients() { return urgentClients; }
        public void setUrgentClients(long urgentClients) { this.urgentClients = urgentClients; }

        public long getHighPriorityClients() { return highPriorityClients; }
        public void setHighPriorityClients(long highPriorityClients) { this.highPriorityClients = highPriorityClients; }

        public long getMediumPriorityClients() { return mediumPriorityClients; }
        public void setMediumPriorityClients(long mediumPriorityClients) { this.mediumPriorityClients = mediumPriorityClients; }

        public long getLowPriorityClients() { return lowPriorityClients; }
        public void setLowPriorityClients(long lowPriorityClients) { this.lowPriorityClients = lowPriorityClients; }

        public double getPriorityHandlingEfficiency() { return priorityHandlingEfficiency; }
        public void setPriorityHandlingEfficiency(double priorityHandlingEfficiency) { this.priorityHandlingEfficiency = priorityHandlingEfficiency; }
    }

    /**
     * Performance Trend Point nested class
     */
    public static class PerformanceTrendPoint {
        private String date;
        private double performanceScore;
        private long actions;
        private long approvals;
        private double approvalRate;

        public PerformanceTrendPoint() {}

        public PerformanceTrendPoint(String date, double performanceScore, long actions,
                                   long approvals, double approvalRate) {
            this.date = date;
            this.performanceScore = performanceScore;
            this.actions = actions;
            this.approvals = approvals;
            this.approvalRate = approvalRate;
        }

        // Getters and Setters
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public double getPerformanceScore() { return performanceScore; }
        public void setPerformanceScore(double performanceScore) { this.performanceScore = performanceScore; }

        public long getActions() { return actions; }
        public void setActions(long actions) { this.actions = actions; }

        public long getApprovals() { return approvals; }
        public void setApprovals(long approvals) { this.approvals = approvals; }

        public double getApprovalRate() { return approvalRate; }
        public void setApprovalRate(double approvalRate) { this.approvalRate = approvalRate; }
    }

    /**
     * Activity Group for timeline view
     */
    public static class ActivityGroup {
        private String date;
        private List<ActivityItem> activities;
        private long totalActivities;

        public ActivityGroup() {}

        public ActivityGroup(String date, List<ActivityItem> activities, long totalActivities) {
            this.date = date;
            this.activities = activities;
            this.totalActivities = totalActivities;
        }

        // Getters and Setters
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public List<ActivityItem> getActivities() { return activities; }
        public void setActivities(List<ActivityItem> activities) { this.activities = activities; }

        public long getTotalActivities() { return totalActivities; }
        public void setTotalActivities(long totalActivities) { this.totalActivities = totalActivities; }
    }

    /**
     * Activity Item for detailed activity view
     */
    public static class ActivityItem {
        private long id;
        private String actionType;
        private String description;
        private Instant timestamp;
        private String clientName;
        private Long clientId;
        private String impact; // HIGH, MEDIUM, LOW
        private String status; // SUCCESS, FAILED, PENDING

        public ActivityItem() {}

        public ActivityItem(long id, String actionType, String description, Instant timestamp,
                          String clientName, Long clientId, String impact, String status) {
            this.id = id;
            this.actionType = actionType;
            this.description = description;
            this.timestamp = timestamp;
            this.clientName = clientName;
            this.clientId = clientId;
            this.impact = impact;
            this.status = status;
        }

        // Getters and Setters
        public long getId() { return id; }
        public void setId(long id) { this.id = id; }

        public String getActionType() { return actionType; }
        public void setActionType(String actionType) { this.actionType = actionType; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public String getImpact() { return impact; }
        public void setImpact(String impact) { this.impact = impact; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}