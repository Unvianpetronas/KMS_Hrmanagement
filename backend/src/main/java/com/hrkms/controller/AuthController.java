package com.hrkms.controller;

import com.hrkms.dto.AuthDTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    // ========================
    // AUTHENTICATION
    // ========================

    @PostMapping("/login")
    public ResponseEntity<com.hrkms.dto.AuthDTO.LoginResponse> login(@Valid @RequestBody com.hrkms.dto.AuthDTO.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<com.hrkms.dto.AuthDTO.UserResponse> getCurrentUser(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(authService.getMe(token));
    }

    // ========================
    // USER MANAGEMENT (Admin only)
    // ========================

    @GetMapping("/users")
    public ResponseEntity<List<com.hrkms.dto.AuthDTO.UserResponse>> getAllUsers(
            @RequestHeader("Authorization") String token) {
        authService.requireAdmin(token); // JWT parse + role check, no DB
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<com.hrkms.dto.AuthDTO.UserResponse> getUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        authService.requireAdmin(token);
        return ResponseEntity.ok(authService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<com.hrkms.dto.AuthDTO.UserResponse> createUser(
            @Valid @RequestBody com.hrkms.dto.AuthDTO.CreateUserRequest req,
            @RequestHeader("Authorization") String token) {
        authService.requireAdmin(token);
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createUser(req));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<com.hrkms.dto.AuthDTO.UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody com.hrkms.dto.AuthDTO.UpdateUserRequest req,
            @RequestHeader("Authorization") String token) {
        authService.requireAdmin(token);
        return ResponseEntity.ok(authService.updateUser(id, req));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        authService.requireAdmin(token);
        authService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Xóa user thành công"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody AuthDTO.ChangePasswordRequest req,
            @RequestHeader("Authorization") String token) {
        JwtUser jwtUser = authService.validateToken(token);
        authService.changePassword(jwtUser.getUserId(), req);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
