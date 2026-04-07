package com.kredia.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.kredia.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
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
                corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:5173", "http://localhost:5174"));
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
                // Health check endpoint
                .requestMatchers("/actuator/health").permitAll()
                // Any other request needs authentication
                .anyRequest().authenticated()
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
