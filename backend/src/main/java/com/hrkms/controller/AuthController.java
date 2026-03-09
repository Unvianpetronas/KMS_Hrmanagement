package com.hrkms.controller;

import com.hrkms.dto.AuthDTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest req) {
        try {
            logger.info("Login attempt for user: {}", req.getUsername());
            return ResponseEntity.ok(authService.login(req));
        } catch (Exception e) {
            logger.error("Login failed for user: {} - {}", req.getUsername(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("Authorization") String token) {
        logger.info("Logout request received");
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDTO.UserResponse> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            logger.info("Get current user info");
            return ResponseEntity.ok(authService.getMe(token));
        } catch (Exception e) {
            logger.error("Get current user failed - {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<AuthDTO.UserResponse>> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Admin get all users");
            return ResponseEntity.ok(authService.getAllUsers());
        } catch (Exception e) {
            logger.error("Get all users failed - {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AuthDTO.UserResponse> getUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Admin get user id: {}", id);
            return ResponseEntity.ok(authService.getUserById(id));
        } catch (Exception e) {
            logger.error("Get user id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/users")
    public ResponseEntity<AuthDTO.UserResponse> createUser(
            @Valid @RequestBody AuthDTO.CreateUserRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Admin create user: {}", req.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(authService.createUser(req));
        } catch (Exception e) {
            logger.error("Create user: {} failed - {}", req.getUsername(), e.getMessage());
            throw e;
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AuthDTO.UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AuthDTO.UpdateUserRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Admin update user id: {}", id);
            return ResponseEntity.ok(authService.updateUser(id, req));
        } catch (Exception e) {
            logger.error("Update user id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Admin delete user id: {}", id);
            authService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Xóa user thành công"));
        } catch (Exception e) {
            logger.error("Delete user id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody AuthDTO.ChangePasswordRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser jwtUser = authService.validateToken(token);
            logger.info("Change password for userId: {}", jwtUser.getUserId());
            authService.changePassword(jwtUser.getUserId(), req);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
        } catch (Exception e) {
            logger.error("Change password failed - {}", e.getMessage());
            throw e;
        }
    }
}
