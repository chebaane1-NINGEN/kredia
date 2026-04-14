package com.kredia.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequestDTO {

    @NotBlank(message = "Google idToken is required")
    private String idToken;

    public GoogleLoginRequestDTO() {
    }

    public GoogleLoginRequestDTO(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
