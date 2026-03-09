package com.hrkms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

public class TagDTO {

    // Request khi tạo tag mới
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateTagRequest {
        @NotBlank(message = "Tên tag không được để trống")
        private String name;
        private String description;
    }

    // Request khi update tag
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateTagRequest {
        @NotBlank(message = "Tên tag không được để trống")
        private String name;
        private String description;
    }

    // Response trả về cho client
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TagResponse {
        private Long id;
        private String name;
        private String description;
        private LocalDate createdDate;
    }
}