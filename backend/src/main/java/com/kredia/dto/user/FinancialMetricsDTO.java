package com.kredia.dto.user;

public class FinancialMetricsDTO {

    private int accountHealth;
    private String riskLevel;
    private String activityLevel;
    private int accountAgeMonths;
    private int daysSinceLastActivity;
    private int totalActivityCount;

    public int getAccountHealth() { return accountHealth; }
    public void setAccountHealth(int accountHealth) { this.accountHealth = accountHealth; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public int getAccountAgeMonths() { return accountAgeMonths; }
    public void setAccountAgeMonths(int accountAgeMonths) { this.accountAgeMonths = accountAgeMonths; }

    public int getDaysSinceLastActivity() { return daysSinceLastActivity; }
    public void setDaysSinceLastActivity(int daysSinceLastActivity) { this.daysSinceLastActivity = daysSinceLastActivity; }

    public int getTotalActivityCount() { return totalActivityCount; }
    public void setTotalActivityCount(int totalActivityCount) { this.totalActivityCount = totalActivityCount; }
}
