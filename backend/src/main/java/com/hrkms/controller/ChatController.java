package com.hrkms.controller;

import com.hrkms.dto.ChatDTO;
import com.hrkms.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @PostMapping
    public ResponseEntity<ChatDTO.ChatResponse> chat(@Valid @RequestBody ChatDTO.ChatRequest req) {
        try {
            logger.info("Chat request: {}", req.getMessage());
            ChatDTO.ChatResponse response = chatService.chat(req.getMessage(), req.getConversationHistory());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Chat request failed - {}", e.getMessage());
            throw e;
        }
    }
}
