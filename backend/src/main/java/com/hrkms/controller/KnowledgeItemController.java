package com.hrkms.controller;

import com.hrkms.dto.DTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.service.AuthService;
import com.hrkms.service.KnowledgeItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KnowledgeItemController {

    private static final Logger logger = LoggerFactory.getLogger(KnowledgeItemController.class);

    private final KnowledgeItemService service;
    private final AuthService authService;

    // ========================
    // PUBLIC
    // ========================

    @GetMapping("/items")
    public ResponseEntity<List<com.hrkms.dto.DTO.ItemResponse>> getAllItems(
            @RequestParam(defaultValue = "updated") String sort) {
        return ResponseEntity.ok(service.getAllItems(sort));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> getItem(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<com.hrkms.dto.DTO.ItemResponse>> searchItems(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "updated") String sort) {
        return ResponseEntity.ok(service.search(q, type, tags, sort));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    // ========================
    // LOGGED-IN USER — rate + comment (parse JWT)
    // ========================

    @PostMapping("/items/{id}/rate")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> rateItem(
            @PathVariable String id,
            @RequestBody com.hrkms.dto.DTO.RatingRequest req,
            @RequestHeader("Authorization") String token) {
        authService.validateToken(token); // JWT parse only
        return ResponseEntity.ok(service.rateItem(id, req.getStars()));
    }

    @PostMapping("/items/{id}/comments")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody com.hrkms.dto.DTO.CommentRequest req,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.validateToken(token);
        req.setUserName(user.getFullName());
        return ResponseEntity.ok(service.addComment(id, req));
    }

    // ========================
    // ADMIN / MANAGER — create, edit, delete, publish (JWT check role)
    // ========================

    @PostMapping("/items")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> createItem(
            @Valid @RequestBody com.hrkms.dto.DTO.CreateItemRequest req,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.requireManager(token); // JWT parse + role check
        if (req.getAuthor() == null || req.getAuthor().isBlank()) {
            req.setAuthor(user.getFullName());
        }
        DTO.ItemResponse created = service.createItem(req);
        logger.info("Item created successfully: id: {} title: {} by: {}", created.getId(), created.getTitle(), user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> updateItem(
            @PathVariable String id,
            @Valid @RequestBody com.hrkms.dto.DTO.CreateItemRequest req,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.requireManager(token);
        DTO.ItemResponse updated = service.updateItem(id, req);
        logger.info("Item updated successfully: id: {} by: {}", id, user.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, String>> deleteItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.requireManager(token);
        service.deleteItem(id);
        logger.info("Item deleted successfully: id: {} by: {}", id, user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Đã xóa bài tri thức " + id));
    }

    @PutMapping("/items/{id}/publish")
    public ResponseEntity<com.hrkms.dto.DTO.ItemResponse> publishItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.requireManager(token);
        DTO.ItemResponse result = service.publishItem(id);
        logger.info("Item published successfully: id: {} by: {}", id, user.getUsername());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/items/{id}/archive")
    public ResponseEntity<DTO.ItemResponse> archiveItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        JwtUser user = authService.requireAdmin(token);
        DTO.ItemResponse result = service.archiveItem(id);
        logger.info("Item archived successfully: id: {} by: {}", id, user.getUsername());
        return ResponseEntity.ok(result);
    }
}
