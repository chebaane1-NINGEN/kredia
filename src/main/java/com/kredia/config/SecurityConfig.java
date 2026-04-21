package com.kredia.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.kredia.security.JwtAuthenticationFilter;
import com.kredia.security.CustomOAuth2UserService;
import com.kredia.security.OAuth2AuthenticationSuccessHandler;
import org.springframework.http.HttpStatus;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CustomOAuth2UserService customOAuth2UserService,
                          OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for JWT
            .csrf(csrf -> csrf.disable())
            // Configure session management
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Configure CORS
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                corsConfiguration.setAllowCredentials(true);
                corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"));
                corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                corsConfiguration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                return corsConfiguration;
            }))
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Allow auth endpoints without authentication
                .requestMatchers("/api/auth/**").permitAll()
                // Allow public resources
                .requestMatchers("/api/public/**").permitAll()
                // Admin endpoints require ADMIN role
                .requestMatchers("/api/user/admin/**").hasRole("ADMIN")
                // Agent endpoints require AGENT role
                .requestMatchers("/api/user/agent/**").hasRole("AGENT")
                // Client endpoints require CLIENT role
                .requestMatchers("/api/user/client/**").hasRole("CLIENT")
                // User management endpoints require authentication
                .requestMatchers("/api/user/**").authenticated()
                // Dashboard endpoints require authentication
                .requestMatchers("/admin/**").authenticated()
                .requestMatchers("/agent/**").authenticated()
                .requestMatchers("/client/**").authenticated()
                // OAuth2 endpoints should be publicly accessible for redirects
                .requestMatchers("/oauth2/**").permitAll()
                // Health check endpoints should be public
                .requestMatchers("/api/health", "/api/health/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // Any other request needs authentication
                .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            // OAuth2 Login configuration
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            // Add JWT filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
