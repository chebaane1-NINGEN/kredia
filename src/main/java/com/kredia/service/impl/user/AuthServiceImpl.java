package com.kredia.service.impl.user;

import com.kredia.dto.auth.LoginRequestDTO;
import com.kredia.dto.auth.RegisterRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserStatus;
import com.kredia.entity.user.UserRole;
import com.kredia.exception.BusinessException;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.mapper.user.UserMapper;
import com.kredia.repository.user.UserRepository;
import com.kredia.security.JwtTokenProvider;
import com.kredia.service.user.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(UserRepository userRepository, 
                           UserMapper userMapper, 
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public UserResponseDTO register(RegisterRequestDTO request) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new BusinessException("Email already exists");
        }
        if (userRepository.existsByPhoneNumberAndDeletedFalse(request.getPhoneNumber())) {
            throw new BusinessException("Phone number already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setRole(UserRole.CLIENT);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setEmailVerified(false);
        user.setDeleted(false);

        User saved = userRepository.save(user);
        
        // TODO: Send Email with verification token in a real app
        
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public String login(LoginRequestDTO request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.BLOCKED || user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException("Account is locked or suspended");
        }

        return tokenProvider.generateToken(user.getId());
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BusinessException("Invalid verification token"));

        if (user.isEmailVerified()) {
            throw new BusinessException("Email is already verified");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        // In a real app, generate a reset token and send an email
        user.setVerificationToken(UUID.randomUUID().toString());
        userRepository.save(user);
    }
}
