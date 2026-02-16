package com.kredia.auth;

public class AuthenticationResponse {
    private String token;
    private Long userId;
    private String role;
    private String status;

    public AuthenticationResponse() {}

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static AuthenticationResponseBuilder builder() { return new AuthenticationResponseBuilder(); }

    public static class AuthenticationResponseBuilder {
        private AuthenticationResponse res = new AuthenticationResponse();
        public AuthenticationResponseBuilder token(String t) { res.setToken(t); return this; }
        public AuthenticationResponseBuilder userId(Long id) { res.setUserId(id); return this; }
        public AuthenticationResponseBuilder role(String r) { res.setRole(r); return this; }
        public AuthenticationResponseBuilder status(String s) { res.setStatus(s); return this; }
        public AuthenticationResponse build() { return res; }
    }
}
