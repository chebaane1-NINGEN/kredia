package com.kredia.dto.user;

public class ClientEligibilityDTO {

    private boolean eligible;
    private String reason;
    private int scoreThreshold;
    private int currentScore;
    private boolean isActive;
    private String statusReason;

    public ClientEligibilityDTO() {
        this.scoreThreshold = 60; // Eligibility threshold
    }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public int getScoreThreshold() { return scoreThreshold; }
    public void setScoreThreshold(int scoreThreshold) { this.scoreThreshold = scoreThreshold; }

    public int getCurrentScore() { return currentScore; }
    public void setCurrentScore(int currentScore) { this.currentScore = currentScore; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getStatusReason() { return statusReason; }
    public void setStatusReason(String statusReason) { this.statusReason = statusReason; }
}
