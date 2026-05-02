package com.kredia.dto.user;

public class ScoreHistoryPointDTO {

    private String timestamp;
    private int score;
    private int baseScore;
    private int statusBonus;
    private int suspensionPenalty;
    private int activityBonus;
    private int seniorityBonus;
    private String reason;

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getBaseScore() { return baseScore; }
    public void setBaseScore(int baseScore) { this.baseScore = baseScore; }

    public int getStatusBonus() { return statusBonus; }
    public void setStatusBonus(int statusBonus) { this.statusBonus = statusBonus; }

    public int getSuspensionPenalty() { return suspensionPenalty; }
    public void setSuspensionPenalty(int suspensionPenalty) { this.suspensionPenalty = suspensionPenalty; }

    public int getActivityBonus() { return activityBonus; }
    public void setActivityBonus(int activityBonus) { this.activityBonus = activityBonus; }

    public int getSeniorityBonus() { return seniorityBonus; }
    public void setSeniorityBonus(int seniorityBonus) { this.seniorityBonus = seniorityBonus; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
