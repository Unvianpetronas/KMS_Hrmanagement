package com.hrkms.dto;

import lombok.*;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JwtUser {
    private Long userId;
    private String username;
    private String role;      // "ADMIN", "MANAGER", "USER"
    private String fullName;

    public boolean canManageItems() {
        return "ADMIN".equals(role) || "MANAGER".equals(role);
    }

    public boolean canManageUsers() {
        return "ADMIN".equals(role);
    }
}
