package com.kredia.auth;

public class AuthenticationRequest {
    private String email;
    private String password;

    public AuthenticationRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public static AuthenticationRequestBuilder builder() { return new AuthenticationRequestBuilder(); }

    public static class AuthenticationRequestBuilder {
        private AuthenticationRequest req = new AuthenticationRequest();
        public AuthenticationRequestBuilder email(String e) { req.setEmail(e); return this; }
        public AuthenticationRequestBuilder password(String p) { req.setPassword(p); return this; }
        public AuthenticationRequest build() { return req; }
    }
}
