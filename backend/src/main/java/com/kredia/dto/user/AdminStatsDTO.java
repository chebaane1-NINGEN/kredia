package com.kredia.dto.user;

import com.kredia.entity.user.UserRole;

import java.util.Map;
import java.util.List;

public class AdminStatsDTO {

    private long totalUser;
    private long totalClient;
    private long totalAgent;
    private long activeUser;
    private long blockedUser;
    private long suspendedUser;
    private long last24hRegistrations;
    private Map<UserRole, Long> roleDistribution;
    private double systemHealthIndex;
    private Map<String, Long> registrationEvolution;
    private List<UserActivityResponseDTO> recentActivities;

    public AdminStatsDTO() {}

    public Map<String, Long> getRegistrationEvolution() { return registrationEvolution; }
    public void setRegistrationEvolution(Map<String, Long> registrationEvolution) { this.registrationEvolution = registrationEvolution; }

    public List<UserActivityResponseDTO> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<UserActivityResponseDTO> recentActivities) { this.recentActivities = recentActivities; }

    public long getTotalUser() { return totalUser; }
    public void setTotalUser(long totalUser) { this.totalUser = totalUser; }

    public long getTotalClient() { return totalClient; }
    public void setTotalClient(long totalClient) { this.totalClient = totalClient; }

    public long getTotalAgent() { return totalAgent; }
    public void setTotalAgent(long totalAgent) { this.totalAgent = totalAgent; }

    public long getActiveUser() { return activeUser; }
    public void setActiveUser(long activeUser) { this.activeUser = activeUser; }

    public long getBlockedUser() { return blockedUser; }
    public void setBlockedUser(long blockedUser) { this.blockedUser = blockedUser; }

    public long getSuspendedUser() { return suspendedUser; }
    public void setSuspendedUser(long suspendedUser) { this.suspendedUser = suspendedUser; }

    public long getLast24hRegistrations() { return last24hRegistrations; }
    public void setLast24hRegistrations(long last24hRegistrations) { this.last24hRegistrations = last24hRegistrations; }

    public Map<UserRole, Long> getRoleDistribution() { return roleDistribution; }
    public void setRoleDistribution(Map<UserRole, Long> roleDistribution) { this.roleDistribution = roleDistribution; }

    public double getSystemHealthIndex() { return systemHealthIndex; }
    public void setSystemHealthIndex(double systemHealthIndex) { this.systemHealthIndex = systemHealthIndex; }
}
