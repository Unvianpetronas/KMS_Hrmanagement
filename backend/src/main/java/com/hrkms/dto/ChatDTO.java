package com.hrkms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.Map;

public class ChatDTO {

    @Data
    public static class ChatRequest {
        @NotBlank(message = "Message không được để trống") private String message;
        private List<Map<String, String>> conversationHistory;
    }

    @Data
    public static class ChatResponse {
        private String answer;
        private List<SourceDoc> sourceDocs;
        private String model;

        public ChatResponse(String answer, List<SourceDoc> sourceDocs, String model) {
            this.answer = answer;
            this.sourceDocs = sourceDocs;
            this.model = model;
        }
    }

    @Data
    public static class SourceDoc {
        private String id;
        private String title;

        public SourceDoc(String id, String title) {
            this.id = id;
            this.title = title;
        }
    }
}
