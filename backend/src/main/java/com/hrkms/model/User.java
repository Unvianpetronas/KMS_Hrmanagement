package com.hrkms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Column(nullable = false)
    private String password; // BCrypt hashed

    @NotBlank
    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String department;

    /**
     * ADMIN   - Full quyền: CRUD tất cả items, quản lý users
     * MANAGER - Tạo/sửa/xóa Policy, FAQ, Checklist trong department mình
     * USER    - Chỉ xem, search, filter, rating, comment
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private LocalDate createdDate = LocalDate.now();

    private LocalDate lastLogin;

    public enum Role {
        ADMIN,    // Full access: CRUD items + manage users
        MANAGER,  // Create/Edit/Delete knowledge items
        USER      // Read-only + rate + comment
    }

    /**
     * Check if user can create/edit/delete knowledge items
     */
    public boolean canManageItems() {
        return role == Role.ADMIN || role == Role.MANAGER;
    }

    /**
     * Check if user can manage other users
     */
    public boolean canManageUsers() {
        return role == Role.ADMIN;
    }
}
