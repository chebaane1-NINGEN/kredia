package com.kredia.dto.auth;

import com.kredia.dto.user.UserResponseDTO;

public class AuthResponseDTO {
    private String token;
    private String type = "Bearer";
    private String role;
    private UserResponseDTO user;

    public AuthResponseDTO(String token) {
        this.token = token;
    }

    public AuthResponseDTO(String token, String role, UserResponseDTO user) {
        this.token = token;
        this.role = role;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public UserResponseDTO getUser() { return user; }
    public void setUser(UserResponseDTO user) { this.user = user; }
}
