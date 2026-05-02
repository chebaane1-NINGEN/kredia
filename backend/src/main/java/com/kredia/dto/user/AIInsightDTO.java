package com.kredia.dto.user;

public class AIInsightDTO {

    private String insightId;
    private String category;
    private String title;
    private String message;
    private int confidence;
    private boolean actionable;
    private String suggestedAction;

    public String getInsightId() { return insightId; }
    public void setInsightId(String insightId) { this.insightId = insightId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public boolean isActionable() { return actionable; }
    public void setActionable(boolean actionable) { this.actionable = actionable; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
}
