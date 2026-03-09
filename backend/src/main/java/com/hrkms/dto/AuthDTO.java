package com.hrkms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

public class AuthDTO {

    // === LOGIN ===
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginResponse {
        private Long userId;
        private String username;
        private String fullName;
        private String email;
        private String department;
        private String role;
        private String token; // Simple token
    }

    // === REGISTER / CREATE USER (Admin only) ===
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateUserRequest {
        @NotBlank private String username;
        @NotBlank @jakarta.validation.constraints.Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự") private String password;
        @NotBlank private String fullName;
        private String email;
        private String department;
        private String role; // ADMIN, MANAGER, USER
    }

    // === UPDATE USER ===
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateUserRequest {
        private String fullName;
        private String email;
        private String department;
        private String role;
        private Boolean active;
    }

    // === CHANGE PASSWORD ===
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank @jakarta.validation.constraints.Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự") private String newPassword;
    }

    // === USER RESPONSE ===
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserResponse {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String department;
        private String role;
        private Boolean active;
        private LocalDate createdDate;
        private LocalDate lastLogin;
    }
}
