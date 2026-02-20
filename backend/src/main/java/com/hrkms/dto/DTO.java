package com.hrkms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

public class DTO {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateItemRequest {
        @NotBlank private String title;
        @NotBlank private String type;
        @NotEmpty private List<String> tags;
        private String audience;
        @NotBlank private String content;
        private List<String> relatedItems;
        private String author;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ItemResponse {
        private String id;
        private String title;
        private String type;
        private List<String> tags;
        private String audience;
        private String content;
        private List<String> relatedItems;
        private String author;
        private String version;
        private LocalDate createdDate;
        private LocalDate updatedDate;
        private String status;
        private Double rating;
        private Integer ratingCount;
        private List<CommentResponse> comments;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CommentResponse {
        private Long id;
        private String userName;
        private String text;
        private LocalDate createdDate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CommentRequest {
        private String userName;
        @NotBlank private String text;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RatingRequest {
        private Integer stars; // 1-5
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SearchRequest {
        private String query;
        private String type;
        private List<String> tags;
        private String sortBy; // updated, rating, title
    }
}
