package com.kredia.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import com.kredia.repository.user.UserRepository;
import com.kredia.entity.user.User;

import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        System.out.println("=== JWT FILTER CALLED ===");
        System.out.println("Request URI: " + request.getRequestURI());
        
        // Skip auth endpoints
        if (request.getRequestURI().startsWith("/api/auth/")) {
            System.out.println("Skipping auth endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            System.out.println("JWT extracted: " + (jwt != null ? "YES" : "NO"));
            if (jwt != null) {
                System.out.println("JWT length: " + jwt.length());
                System.out.println("JWT valid: " + tokenProvider.validateToken(jwt));
            }
            
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Long actorId = tokenProvider.getActorIdFromToken(jwt);
                System.out.println("Actor ID from JWT: " + actorId);
                
                // Récupérer l'utilisateur depuis la base pour obtenir le rôle
                User user = userRepository.findById(actorId != null ? actorId : 0L).orElse(null);
                if (user != null) {
                    System.out.println("User found: " + user.getEmail());
                    System.out.println("User role: " + user.getRole().name());
                    
                    // Créer les authorities basées sur le rôle
                    List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                    );
                    
                    // Créer l'authentication
                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                        actorId, null, authorities
                    );
                    
                    // Définir l'authentication dans le SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    System.out.println("=== JWT AUTHENTICATION ===");
                    System.out.println("User ID: " + actorId);
                    System.out.println("Role: " + user.getRole().name());
                    System.out.println("Authorities: " + authorities);
                } else {
                    System.out.println("User not found for ID: " + actorId);
                }
                
                // Wrap the request to dynamically provide X-Actor-Id
                HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(request) {
                    @Override
                    public String getHeader(String name) {
                        if ("X-Actor-Id".equalsIgnoreCase(name)) {
                            System.out.println("X-Actor-Id header requested, returning: " + actorId);
                            return String.valueOf(actorId);
                        }
                        return super.getHeader(name);
                    }

                    @Override
                    public Enumeration<String> getHeaders(String name) {
                        if ("X-Actor-Id".equalsIgnoreCase(name)) {
                            return Collections.enumeration(List.of(String.valueOf(actorId)));
                        }
                        return super.getHeaders(name);
                    }
                };

                filterChain.doFilter(wrappedRequest, response);
                return;
            } else {
                System.out.println("JWT validation failed or empty");
            }
        } catch (Exception ex) {
            System.out.println("JWT Filter Exception: " + ex.getMessage());
            logger.error("Could not set user authentication in filter", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
