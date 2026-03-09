package com.hrkms.service;

import com.hrkms.config.JwtService;
import com.hrkms.dto.AuthDTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.exception.*;
import com.hrkms.model.*;
import com.hrkms.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ================================================================
    // AUTHENTICATION
    // ================================================================

    @Transactional
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest req) {
        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Tên đăng nhập không tồn tại"));

        if (!user.getActive()) {
            throw new ValidationException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Mật khẩu không đúng");
        }

        user.setLastLogin(LocalDate.now());
        userRepo.save(user);

        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getFullName()
        );

        return AuthDTO.LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .role(user.getRole().name())
                .token(token)
                .build();
    }

    public JwtUser validateToken(String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("Token không hợp lệ");
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        Claims claims = jwtService.parseToken(cleanToken);
        Long userId = jwtService.getUserId(claims);
        String username = jwtService.getUsername(claims);
        String role = jwtService.getRole(claims);
        String fullName = jwtService.getFullName(claims);
        if (userId == null || username == null || role == null) {
            throw new UnauthorizedException("Token không hợp lệ");
        }
        return JwtUser.builder()
                .userId(userId)
                .username(username)
                .role(role)
                .fullName(fullName)
                .build();
    }

    public JwtUser requireManager(String token) {
        JwtUser user = validateToken(token);
        if (!user.canManageItems()) {
            throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này. Yêu cầu role: ADMIN hoặc MANAGER");
        }
        return user;
    }

    public JwtUser requireAdmin(String token) {
        JwtUser user = validateToken(token);
        if (!user.canManageUsers()) {
            throw new ForbiddenException("Chỉ Admin mới có quyền quản lý tài khoản");
        }
        return user;
    }

    // ================================================================
    // USER MANAGEMENT — Admin only
    // ================================================================

    @Transactional
    public AuthDTO.UserResponse createUser(AuthDTO.CreateUserRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new ConflictException("Tên đăng nhập '" + req.getUsername() + "' đã tồn tại");
        }
        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .department(req.getDepartment())
                .role(parseRole(req.getRole()))
                .active(true)
                .createdDate(LocalDate.now())
                .build();
        return toResponse(userRepo.save(user));
    }

    @Transactional
    public AuthDTO.UserResponse updateUser(Long id, AuthDTO.UpdateUserRequest req) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user id: " + id));
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        if (req.getActive() != null) user.setActive(req.getActive());
        if (req.getRole() != null) user.setRole(parseRole(req.getRole()));
        return toResponse(userRepo.save(user));
    }

    @Transactional
    public void changePassword(Long userId, AuthDTO.ChangePasswordRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        if (user.getRole() == User.Role.ADMIN) {
            long adminCount = userRepo.findByRole(User.Role.ADMIN).size();
            if (adminCount <= 1) {
                throw new ValidationException("Không thể xóa Admin cuối cùng trong hệ thống");
            }
        }
        userRepo.deleteById(id);
    }

    public List<AuthDTO.UserResponse> getAllUsers() {
        return userRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AuthDTO.UserResponse getUserById(Long id) {
        return userRepo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    public AuthDTO.UserResponse getMe(String token) {
        JwtUser jwtUser = validateToken(token);
        return userRepo.findById(jwtUser.getUserId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    // ================================================================
    // HELPERS
    // ================================================================

    private User.Role parseRole(String roleStr) {
        if (roleStr == null) return User.Role.USER;
        try {
            return User.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Role không hợp lệ. Chọn: ADMIN, MANAGER, USER");
        }
    }

    private AuthDTO.UserResponse toResponse(User user) {
        return AuthDTO.UserResponse.builder()
                .id(user.getId()).username(user.getUsername())
                .fullName(user.getFullName()).email(user.getEmail())
                .department(user.getDepartment()).role(user.getRole().name())
                .active(user.getActive()).createdDate(user.getCreatedDate())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
