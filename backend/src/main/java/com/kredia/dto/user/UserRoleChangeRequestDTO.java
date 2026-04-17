package com.kredia.dto.user;

import com.kredia.entity.user.UserRole;
import jakarta.validation.constraints.NotNull;

public class UserRoleChangeRequestDTO {

    @NotNull(message = "role is required")
    private UserRole role;

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
}
