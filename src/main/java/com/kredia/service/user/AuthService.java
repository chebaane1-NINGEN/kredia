package com.kredia.service.user;

import com.kredia.dto.auth.AuthResponseDTO;
import com.kredia.dto.auth.LoginRequestDTO;
import com.kredia.dto.auth.RegisterRequestDTO;
import com.kredia.dto.user.UserResponseDTO;

public interface AuthService {
    UserResponseDTO register(RegisterRequestDTO request);
    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO loginWithGoogle(String idToken);
    void verifyEmail(String token);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
}
