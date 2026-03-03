package com.kredia.dto;

import com.kredia.enums.UserRole;

import java.util.Map;

public class AdminStatsDTO {

    private long totalUsers;
    private long totalClients;
    private long totalAgents;
    private long activeUsers;
    private long blockedUsers;
    private long suspendedUsers;
    private long last24hRegistrations;
    private Map<UserRole, Long> roleDistribution;
    private double systemHealthIndex;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalClients() {
        return totalClients;
    }

    public void setTotalClients(long totalClients) {
        this.totalClients = totalClients;
    }

    public long getTotalAgents() {
        return totalAgents;
    }

    public void setTotalAgents(long totalAgents) {
        this.totalAgents = totalAgents;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getBlockedUsers() {
        return blockedUsers;
    }

    public void setBlockedUsers(long blockedUsers) {
        this.blockedUsers = blockedUsers;
    }

    public long getSuspendedUsers() {
        return suspendedUsers;
    }

    public void setSuspendedUsers(long suspendedUsers) {
        this.suspendedUsers = suspendedUsers;
    }

    public long getLast24hRegistrations() {
        return last24hRegistrations;
    }

    public void setLast24hRegistrations(long last24hRegistrations) {
        this.last24hRegistrations = last24hRegistrations;
    }

    public Map<UserRole, Long> getRoleDistribution() {
        return roleDistribution;
    }

    public void setRoleDistribution(Map<UserRole, Long> roleDistribution) {
        this.roleDistribution = roleDistribution;
    }

    public double getSystemHealthIndex() {
        return systemHealthIndex;
    }

    public void setSystemHealthIndex(double systemHealthIndex) {
        this.systemHealthIndex = systemHealthIndex;
    }
}
