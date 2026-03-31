package com.kredia.service.user;

import com.kredia.dto.auth.LoginRequestDTO;
import com.kredia.dto.auth.RegisterRequestDTO;
import com.kredia.dto.user.UserResponseDTO;

public interface AuthService {
    UserResponseDTO register(RegisterRequestDTO request);
    String login(LoginRequestDTO request);
    void verifyEmail(String token);
    void forgotPassword(String email);
}
