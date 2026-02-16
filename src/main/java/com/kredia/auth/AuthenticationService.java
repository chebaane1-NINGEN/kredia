package com.kredia.auth;

import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

        private final UserRepository userRepository;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                var user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow();

                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("role", user.getRole().name());
                extraClaims.put("userId", user.getUserId());
                extraClaims.put("status", user.getStatus().name());

                var jwtToken = jwtService.generateToken(extraClaims, user);

                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .userId(user.getUserId())
                                .role(user.getRole().name())
                                .status(user.getStatus().name())
                                .build();
        }
}
