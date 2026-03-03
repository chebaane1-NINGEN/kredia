package com.kredia.dto;

import com.kredia.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public class UserRoleChangeRequestDTO {

    @NotNull(message = "role is required")
    private UserRole role;

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
