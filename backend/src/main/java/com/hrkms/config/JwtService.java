package com.hrkms.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret:HrKmsSecretKeyMustBeAtLeast256BitsLongForHS256Algorithm2025!}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) { // default 24h
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generate JWT token with user info embedded in claims.
     */
    public String generateToken(Long userId, String username, String role, String fullName) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claims(Map.of(
                        "userId", userId,
                        "role", role,
                        "fullName", fullName
                ))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /**
     * Parse and validate token → return Claims.
     * Throws exception nếu token invalid/expired.
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("Token đã hết hạn, vui lòng đăng nhập lại");
        } catch (JwtException e) {
            throw new RuntimeException("Token không hợp lệ");
        }
    }

    // === Convenience getters from Claims ===

    public String getUsername(Claims claims) {
        return claims.getSubject();
    }

    public Long getUserId(Claims claims) {
        return claims.get("userId", Long.class);
    }

    public String getRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public String getFullName(Claims claims) {
        return claims.get("fullName", String.class);
    }

    public boolean isExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }
}
