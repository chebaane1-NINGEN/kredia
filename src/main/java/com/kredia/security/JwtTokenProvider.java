package com.kredia.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey jwtSecret;
    private final SignatureAlgorithm jwtAlgorithm;
    private final int jwtExpirationMs = 86400000;

    public JwtTokenProvider(@Value("${jwt.secret:ZmFrZS1zZWNyZXQta2V5LXNob3VsZC1iZS1yZXBsYWNlZA==}") String jwtSecret) {
        byte[] secretBytes = Base64.getDecoder().decode(jwtSecret);

        if (secretBytes.length >= 64) {
            this.jwtAlgorithm = SignatureAlgorithm.HS512;
        } else if (secretBytes.length >= 32) {
            this.jwtAlgorithm = SignatureAlgorithm.HS256;
        } else {
            throw new IllegalArgumentException("JWT secret must be at least 256 bits when decoded. Provide a longer Base64 secret.");
        }

        this.jwtSecret = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(Long actorId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(Long.toString(actorId))
                .claim("email", email)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(jwtSecret, jwtAlgorithm)
                .compact();
    }

    public Long getActorIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("role", String.class);
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(jwtSecret).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
