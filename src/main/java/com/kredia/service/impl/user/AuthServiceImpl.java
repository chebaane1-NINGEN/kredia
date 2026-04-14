package com.kredia.service.impl.user;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.kredia.dto.auth.LoginRequestDTO;
import com.kredia.dto.auth.RegisterRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserStatus;
import com.kredia.entity.user.UserRole;
import com.kredia.exception.BusinessException;
import com.kredia.mapper.user.UserMapper;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.security.JwtTokenProvider;
import com.kredia.service.user.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final com.kredia.service.user.EmailService emailService;
    private final UserActivityRepository userActivityRepository;

    @Value("${google.client.id:}")
    private String googleClientId;

    @Value("${google.oauth2.tokeninfo.url:https://oauth2.googleapis.com/tokeninfo}")
    private String googleTokenInfoUrl;

    public AuthServiceImpl(UserRepository userRepository,
                           UserMapper userMapper,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           com.kredia.service.user.EmailService emailService,
                           UserActivityRepository userActivityRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
        this.userActivityRepository = userActivityRepository;
    }

    @Override
    @Transactional
    public UserResponseDTO register(RegisterRequestDTO request) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new BusinessException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.CLIENT); // Default role for registration
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setEmailVerified(false);
        user.setDeleted(false);
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);

        User saved = userRepository.save(user);
        emailService.sendVerificationEmail(saved.getEmail(), verificationToken);
        log.info("Verification link for {}: http://localhost:5173/verify?token={}", saved.getEmail(), verificationToken);

        // Log activity
        UserActivity activity = new UserActivity();
        activity.setUserId(saved.getId());
        activity.setActionType(UserActivityActionType.CREATED);
        activity.setDescription("User account created with email verification pending");
        userActivityRepository.save(activity);

        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public String login(LoginRequestDTO request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new BusinessException("Please verify your email before logging in");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("Account is blocked due to too many failed attempts or administrative action");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException("Account is suspended");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 3) {
                user.setStatus(UserStatus.BLOCKED);
                emailService.sendSecurityAlert(user.getEmail(), "Account blocked after 3 failed login attempts");
                log.warn("User {} blocked after 3 failed login attempts", user.getEmail());

                // Log failed login and block
                UserActivity failedActivity = new UserActivity();
                failedActivity.setUserId(user.getId());
                failedActivity.setActionType(UserActivityActionType.FAILED_LOGIN);
                failedActivity.setDescription("Account blocked after 3 failed login attempts");
                userActivityRepository.save(failedActivity);

                UserActivity blockActivity = new UserActivity();
                blockActivity.setUserId(user.getId());
                blockActivity.setActionType(UserActivityActionType.ACCOUNT_BLOCKED);
                blockActivity.setDescription("Account automatically blocked due to failed login attempts");
                userActivityRepository.save(blockActivity);
            } else {
                // Log failed login attempt
                UserActivity failedActivity = new UserActivity();
                failedActivity.setUserId(user.getId());
                failedActivity.setActionType(UserActivityActionType.FAILED_LOGIN);
                failedActivity.setDescription("Failed login attempt " + attempts + " of 3");
                userActivityRepository.save(failedActivity);
            }

            userRepository.save(user);
            throw new BusinessException("Invalid email or password. Attempt " + attempts + " of 3");
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        // Log successful login
        UserActivity loginActivity = new UserActivity();
        loginActivity.setUserId(user.getId());
        loginActivity.setActionType(UserActivityActionType.LOGIN);
        loginActivity.setDescription("User logged in successfully");
        userActivityRepository.save(loginActivity);

        return tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
    }

    @Override
    @Transactional
    public String loginWithGoogle(String idToken) {
        GoogleTokenData googleToken = verifyGoogleToken(idToken);

        if (!googleToken.emailVerified()) {
            throw new BusinessException("Google account email is not verified");
        }

        if (!googleClientId.isBlank() && !googleClientId.equals(googleToken.aud())) {
            throw new BusinessException("Invalid Google token audience");
        }

        String email = googleToken.email();
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseGet(() -> {
                    User created = new User();
                    created.setEmail(email);
                    created.setFirstName(googleToken.givenName());
                    created.setLastName(googleToken.familyName());
                    created.setRole(UserRole.CLIENT);
                    created.setStatus(UserStatus.ACTIVE);
                    created.setEmailVerified(true);
                    created.setDeleted(false);
                    created.setVerificationToken(null);
                    User saved = userRepository.save(created);
                    emailService.sendWelcomeEmail(saved.getEmail(), saved.getFirstName());
                    log.info("New Google user created: {}", saved.getEmail());

                    // Log Google user creation
                    UserActivity createActivity = new UserActivity();
                    createActivity.setUserId(saved.getId());
                    createActivity.setActionType(UserActivityActionType.CREATED);
                    createActivity.setDescription("User account created via Google OAuth");
                    userActivityRepository.save(createActivity);

                    return saved;
                });

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("Account is blocked");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException("Account is suspended");
        }

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
            user.setEmailVerified(true);
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        // Log Google login
        UserActivity googleLoginActivity = new UserActivity();
        googleLoginActivity.setUserId(user.getId());
        googleLoginActivity.setActionType(UserActivityActionType.GOOGLE_LOGIN);
        googleLoginActivity.setDescription("User logged in via Google OAuth");
        userActivityRepository.save(googleLoginActivity);

        return tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
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
        userRepository.findByEmailAndDeletedFalse(email).ifPresent(user -> {
            String resetToken = UUID.randomUUID().toString();
            user.setVerificationToken(resetToken);
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
            log.info("Password reset link for {}: http://localhost:5173/reset-password?token={}", user.getEmail(), resetToken);
        });
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BusinessException("Invalid or expired reset token"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setVerificationToken(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    private GoogleTokenData verifyGoogleToken(String idToken) {
        try {
            String requestUrl = googleTokenInfoUrl + "?id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8);
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BusinessException("Invalid Google token");
            }

            Gson gson = new Gson();
            JsonObject json = gson.fromJson(response.body(), JsonObject.class);
            String email = json.has("email") ? json.get("email").getAsString() : null;
            boolean emailVerified = json.has("email_verified") && json.get("email_verified").getAsBoolean();
            String aud = json.has("aud") ? json.get("aud").getAsString() : null;
            String givenName = json.has("given_name") ? json.get("given_name").getAsString() : "";
            String familyName = json.has("family_name") ? json.get("family_name").getAsString() : "";

            if (email == null || email.isBlank()) {
                throw new BusinessException("Invalid Google token payload");
            }

            return new GoogleTokenData(email, emailVerified, aud, givenName, familyName);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unable to verify Google token", ex);
            throw new BusinessException("Unable to verify Google login");
        }
    }

    private static record GoogleTokenData(String email, boolean emailVerified, String aud, String givenName, String familyName) {
    }
}
