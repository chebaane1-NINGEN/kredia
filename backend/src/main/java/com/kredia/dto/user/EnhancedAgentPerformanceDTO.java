package com.kredia.dto.user;

import java.math.BigDecimal;
import java.util.List;

/**
 * Enhanced Agent Performance DTO with comprehensive metrics, trends, and insights
 * Production-ready performance dashboard data
 */
public class EnhancedAgentPerformanceDTO {

    // Core Metrics
    private double performanceScore;
    private double approvalRate;
    private long totalActions;
    private long approvals;
    private long rejections;
    private long clientsHandled;
    private double avgProcessingTime; // in seconds

    // Additional metrics
    private long pendingClients;
    private double efficiencyScore;

    // Trend data (for charts)
    private List<PerformanceTrendPoint> weeklyTrend;
    private List<PerformanceTrendPoint> monthlyTrend;
    private List<ApprovalTrendPoint> approvalTrend;

    // Insights
    private List<String> insights;
    private String performanceStatus; // EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT
    private String performanceColor; // HEX color code

    // Performance compared to last period
    private double scoreChangeFromLastWeek;
    private double approvalRateChangeFromLastWeek;
    private double processingTimeChangeFromLastWeek;

    // Timestamp
    private long generatedAt;

    // Constructors
    public EnhancedAgentPerformanceDTO() {}

    public EnhancedAgentPerformanceDTO(
            double performanceScore,
            double approvalRate,
            long totalActions,
            long approvals,
            long rejections,
            long clientsHandled,
            double avgProcessingTime) {
        this.performanceScore = performanceScore;
        this.approvalRate = approvalRate;
        this.totalActions = totalActions;
        this.approvals = approvals;
        this.rejections = rejections;
        this.clientsHandled = clientsHandled;
        this.avgProcessingTime = avgProcessingTime;
        this.generatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public double getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(double performanceScore) { this.performanceScore = performanceScore; }

    public double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(double approvalRate) { this.approvalRate = approvalRate; }

    public long getTotalActions() { return totalActions; }
    public void setTotalActions(long totalActions) { this.totalActions = totalActions; }

    public long getApprovals() { return approvals; }
    public void setApprovals(long approvals) { this.approvals = approvals; }

    public long getRejections() { return rejections; }
    public void setRejections(long rejections) { this.rejections = rejections; }

    public long getClientsHandled() { return clientsHandled; }
    public void setClientsHandled(long clientsHandled) { this.clientsHandled = clientsHandled; }

    public double getAvgProcessingTime() { return avgProcessingTime; }
    public void setAvgProcessingTime(double avgProcessingTime) { this.avgProcessingTime = avgProcessingTime; }

    public long getPendingClients() { return pendingClients; }
    public void setPendingClients(long pendingClients) { this.pendingClients = pendingClients; }

    public double getEfficiencyScore() { return efficiencyScore; }
    public void setEfficiencyScore(double efficiencyScore) { this.efficiencyScore = efficiencyScore; }

    public List<PerformanceTrendPoint> getWeeklyTrend() { return weeklyTrend; }
    public void setWeeklyTrend(List<PerformanceTrendPoint> weeklyTrend) { this.weeklyTrend = weeklyTrend; }

    public List<PerformanceTrendPoint> getMonthlyTrend() { return monthlyTrend; }
    public void setMonthlyTrend(List<PerformanceTrendPoint> monthlyTrend) { this.monthlyTrend = monthlyTrend; }

    public List<ApprovalTrendPoint> getApprovalTrend() { return approvalTrend; }
    public void setApprovalTrend(List<ApprovalTrendPoint> approvalTrend) { this.approvalTrend = approvalTrend; }

    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }

    public String getPerformanceStatus() { return performanceStatus; }
    public void setPerformanceStatus(String performanceStatus) { this.performanceStatus = performanceStatus; }

    public String getPerformanceColor() { return performanceColor; }
    public void setPerformanceColor(String performanceColor) { this.performanceColor = performanceColor; }

    public double getScoreChangeFromLastWeek() { return scoreChangeFromLastWeek; }
    public void setScoreChangeFromLastWeek(double scoreChangeFromLastWeek) { this.scoreChangeFromLastWeek = scoreChangeFromLastWeek; }

    public double getApprovalRateChangeFromLastWeek() { return approvalRateChangeFromLastWeek; }
    public void setApprovalRateChangeFromLastWeek(double approvalRateChangeFromLastWeek) { this.approvalRateChangeFromLastWeek = approvalRateChangeFromLastWeek; }

    public double getProcessingTimeChangeFromLastWeek() { return processingTimeChangeFromLastWeek; }
    public void setProcessingTimeChangeFromLastWeek(double processingTimeChangeFromLastWeek) { this.processingTimeChangeFromLastWeek = processingTimeChangeFromLastWeek; }

    public long getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(long generatedAt) { this.generatedAt = generatedAt; }

    // Helper method to determine status
    public void updatePerformanceStatus() {
        if (performanceScore >= 90) {
            this.performanceStatus = "EXCELLENT";
            this.performanceColor = "#10B981"; // green
        } else if (performanceScore >= 75) {
            this.performanceStatus = "GOOD";
            this.performanceColor = "#3B82F6"; // blue
        } else if (performanceScore >= 60) {
            this.performanceStatus = "AVERAGE";
            this.performanceColor = "#F59E0B"; // yellow
        } else {
            this.performanceStatus = "NEEDS_IMPROVEMENT";
            this.performanceColor = "#EF4444"; // red
        }
    }

    /**
     * Nested class for trend data points
     */
    public static class PerformanceTrendPoint {
        private String date;
        private double score;
        private long actions;
        private long approvals;

        public PerformanceTrendPoint(String date, double score, long actions, long approvals) {
            this.date = date;
            this.score = score;
            this.actions = actions;
            this.approvals = approvals;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }

        public long getActions() { return actions; }
        public void setActions(long actions) { this.actions = actions; }

        public long getApprovals() { return approvals; }
        public void setApprovals(long approvals) { this.approvals = approvals; }
    }

    /**
     * Nested class for approval trend data
     */
    public static class ApprovalTrendPoint {
        private String date;
        private long approvals;
        private long rejections;

        public ApprovalTrendPoint(String date, long approvals, long rejections) {
            this.date = date;
            this.approvals = approvals;
            this.rejections = rejections;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public long getApprovals() { return approvals; }
        public void setApprovals(long approvals) { this.approvals = approvals; }

        public long getRejections() { return rejections; }
        public void setRejections(long rejections) { this.rejections = rejections; }
    }
}
