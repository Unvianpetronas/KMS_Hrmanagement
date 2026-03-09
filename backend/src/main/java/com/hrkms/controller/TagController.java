package com.hrkms.controller;

import com.hrkms.dto.TagDTO;
import com.hrkms.service.AuthService;
import com.hrkms.service.TagService;
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
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final AuthService authService;
    private static final Logger logger = LoggerFactory.getLogger(TagController.class);

    @GetMapping
    public ResponseEntity<List<TagDTO.TagResponse>> getAllTags() {
        logger.info("Get all tags");
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @PostMapping
    public ResponseEntity<TagDTO.TagResponse> createTag(
            @Valid @RequestBody TagDTO.CreateTagRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireManager(token);
            logger.info("Create tag: {}", req.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(req));
        } catch (Exception e) {
            logger.error("Create tag: {} failed - {}", req.getName(), e.getMessage());
            throw e;
        }
    }

    @PutMapping("/{tagName}")
    public ResponseEntity<TagDTO.TagResponse> updateTag(
            @PathVariable String tagName,
            @Valid @RequestBody TagDTO.UpdateTagRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireManager(token);
            logger.info("Update tag: {}", tagName);
            return ResponseEntity.ok(tagService.updateTag(tagName, req));
        } catch (Exception e) {
            logger.error("Update tag: {} failed - {}", tagName, e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/{tagName}")
    public ResponseEntity<Map<String, String>> deleteTag(
            @PathVariable String tagName,
            @RequestHeader("Authorization") String token) {
        try {
            authService.requireAdmin(token);
            logger.info("Delete tag: {}", tagName);
            tagService.deleteTag(tagName);
            return ResponseEntity.ok(Map.of("message", "Tag đã xóa: " + tagName));
        } catch (Exception e) {
            logger.error("Delete tag: {} failed - {}", tagName, e.getMessage());
            throw e;
        }
    }
}
