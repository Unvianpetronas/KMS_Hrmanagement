package com.hrkms.service;

import com.hrkms.config.JwtService;
import com.hrkms.dto.AuthDTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.model.*;
import com.hrkms.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ================================================================
    // AUTHENTICATION
    // ================================================================

    public com.hrkms.dto.AuthDTO.LoginResponse login(com.hrkms.dto.AuthDTO.LoginRequest req) {
        User user = userRepo.findByUsername(req.getUsername()).orElse(null);

        if (user == null) {
            logger.warn("Login failed for username: {} with error: {}", req.getUsername(), "user not found");
            throw new RuntimeException("Tên đăng nhập không tồn tại");
        }

        if (!user.getActive()) {
            logger.warn("Login failed for username: {} with error: {}", req.getUsername(), "account disabled");
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            logger.warn("Login failed for username: {} with error: {}", req.getUsername(), "wrong password");
            throw new RuntimeException("Mật khẩu không đúng");
        }

        // Update last login
        user.setLastLogin(LocalDate.now());
        userRepo.save(user);

        // Generate JWT — embed tất cả thông tin cần thiết vào token
        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getFullName()
        );

        logger.info("Login successful for username: {} with role: {}", user.getUsername(), user.getRole());

        return com.hrkms.dto.AuthDTO.LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .role(user.getRole().name())
                .token(token)
                .build();
    }

    /**
     * Logout
     */
    public void logout(String token) {
        // JWT is stateless — actual invalidation is handled client-side
        try {
            JwtUser u = validateToken(token);
            logger.info("Logout successful for username: {}", u.getUsername());
        } catch (Exception ignored) {
            // token already invalid — still fine to log out
        }
    }

    public JwtUser validateToken(String token) {
        if (token == null || token.isBlank()) {
            logger.warn("Token validation failed with error: {}", "empty token");
            throw new RuntimeException("Token không hợp lệ");
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;

        try {
            Claims claims = jwtService.parseToken(cleanToken);
            return JwtUser.builder()
                    .userId(jwtService.getUserId(claims))
                    .username(jwtService.getUsername(claims))
                    .role(jwtService.getRole(claims))
                    .fullName(jwtService.getFullName(claims))
                    .build();
        } catch (RuntimeException ex) {
            logger.warn("Token validation failed with error: {}", ex.getMessage());
            throw ex;
        }
    }

    /**
     * Validate + require MANAGER or ADMIN role.
     */
    public JwtUser requireManager(String token) {
        JwtUser user = validateToken(token);
        if (!user.canManageItems()) {
            logger.warn("Access denied for username: {} with role: {} - required: {}", user.getUsername(), user.getRole(), "MANAGER/ADMIN");
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này. Yêu cầu role: ADMIN hoặc MANAGER");
        }
        return user;
    }

    public JwtUser requireAdmin(String token) {
        JwtUser user = validateToken(token);
        if (!user.canManageUsers()) {
            logger.warn("Access denied for username: {} with role: {} - required: {}", user.getUsername(), user.getRole(), "ADMIN");
            throw new RuntimeException("Chỉ Admin mới có quyền quản lý tài khoản");
        }
        return user;
    }

    // ================================================================
    // USER MANAGEMENT — Admin only, these DO query DB (CRUD operations)
    // ================================================================

    @Transactional
    public com.hrkms.dto.AuthDTO.UserResponse createUser(com.hrkms.dto.AuthDTO.CreateUserRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Tên đăng nhập '" + req.getUsername() + "' đã tồn tại");
        }

        User.Role role;
        try {
            role = req.getRole() != null ? User.Role.valueOf(req.getRole().toUpperCase()) : User.Role.USER;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Role không hợp lệ. Chọn: ADMIN, MANAGER, USER");
        }

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .department(req.getDepartment())
                .role(role)
                .active(true)
                .createdDate(LocalDate.now())
                .build();

        AuthDTO.UserResponse result = toResponse(userRepo.save(user));
        logger.info("User created successfully: username: {} with role: {}", req.getUsername(), role);
        return result;
    }

    @Transactional
    public com.hrkms.dto.AuthDTO.UserResponse updateUser(Long id, com.hrkms.dto.AuthDTO.UpdateUserRequest req) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user id: " + id));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        if (req.getActive() != null) user.setActive(req.getActive());
        if (req.getRole() != null) {
            try {
                user.setRole(User.Role.valueOf(req.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Role không hợp lệ");
            }
        }

        AuthDTO.UserResponse result = toResponse(userRepo.save(user));
        logger.info("User updated successfully: id: {} username: {}", id, user.getUsername());
        return result;
    }

    @Transactional
    public void changePassword(Long userId, com.hrkms.dto.AuthDTO.ChangePasswordRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
        logger.info("Password changed successfully for userId: {}", userId);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        if (user.getRole() == User.Role.ADMIN) {
            long adminCount = userRepo.findByRole(User.Role.ADMIN).size();
            if (adminCount <= 1) {
                throw new RuntimeException("Không thể xóa Admin cuối cùng trong hệ thống");
            }
        }
        userRepo.deleteById(id);
        logger.info("User deleted successfully: id: {} username: {}", id, user.getUsername());
    }

    public List<com.hrkms.dto.AuthDTO.UserResponse> getAllUsers() {
        return userRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public com.hrkms.dto.AuthDTO.UserResponse getUserById(Long id) {
        return userRepo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
    }

    /**
     * Get current user info: parse JWT for basic info (stateless),
     * nhưng query DB để lấy thông tin đầy đủ nhất (email, department...).
     */
    public com.hrkms.dto.AuthDTO.UserResponse getMe(String token) {
        JwtUser jwtUser = validateToken(token);
        // Query DB vì user muốn xem full profile (email, department...)
        return userRepo.findById(jwtUser.getUserId())
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ================================================================
    // MAPPER
    // ================================================================

    private com.hrkms.dto.AuthDTO.UserResponse toResponse(User user) {
        return AuthDTO.UserResponse.builder()
                .id(user.getId()).username(user.getUsername())
                .fullName(user.getFullName()).email(user.getEmail())
                .department(user.getDepartment()).role(user.getRole().name())
                .active(user.getActive()).createdDate(user.getCreatedDate())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
