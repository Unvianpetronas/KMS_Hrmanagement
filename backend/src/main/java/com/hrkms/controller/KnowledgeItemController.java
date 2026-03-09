package com.hrkms.controller;

import com.hrkms.dto.DTO;
import com.hrkms.dto.JwtUser;
import com.hrkms.exception.ValidationException;
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
import java.util.Set;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class KnowledgeItemController {

    private final KnowledgeItemService service;
    private final AuthService authService;
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeItemController.class);
    private static final Set<String> VALID_SORT_VALUES = Set.of("updated", "rating", "title");

    // ========================
    // PUBLIC
    // ========================

    @GetMapping("/items")
    public ResponseEntity<List<DTO.ItemResponse>> getAllItems(
            @RequestParam(defaultValue = "updated") String sort) {
        logger.info("Get all items, sort: {}", sort);
        validateSort(sort);
        return ResponseEntity.ok(service.getAllItems(sort));
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<DTO.ItemResponse>> searchItems(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "updated") String sort) {
        logger.info("Search items - q: {}, type: {}, tags: {}, sort: {}", q, type, tags, sort);
        validateSort(sort);
        return ResponseEntity.ok(service.search(q, type, tags, sort));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<DTO.ItemResponse> getItem(@PathVariable String id) {
        logger.info("Get item id: {}", id);
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        logger.info("Get knowledge stats");
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/items/stale")
    public ResponseEntity<List<DTO.ItemResponse>> getStaleItems(
            @RequestParam(defaultValue = "12") int months) {
        logger.info("Get stale items older than {} months", months);
        return ResponseEntity.ok(service.getStaleItems(months));
    }

    // ========================
    // LOGGED-IN USER
    // ========================

    @PostMapping("/items/{id}/rate")
    public ResponseEntity<DTO.ItemResponse> rateItem(
            @PathVariable String id,
            @RequestBody DTO.RatingRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            authService.validateToken(token);
            logger.info("Rate item id: {} with stars: {}", id, req.getStars());
            return ResponseEntity.ok(service.rateItem(id, req.getStars()));
        } catch (Exception e) {
            logger.error("Rate item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/items/{id}/comments")
    public ResponseEntity<DTO.ItemResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody DTO.CommentRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.validateToken(token);
            req.setUserName(user.getFullName());
            logger.info("User: {} add comment to item id: {}", user.getFullName(), id);
            return ResponseEntity.ok(service.addComment(id, req));
        } catch (Exception e) {
            logger.error("Add comment to item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PostMapping("/items/{id}/view")
    public ResponseEntity<Void> recordView(@PathVariable String id) {
        logger.info("Record view for item id: {}", id);
        service.recordView(id);
        return ResponseEntity.ok().build();
    }

    // ========================
    // ADMIN / MANAGER
    // ========================

    @PostMapping("/items")
    public ResponseEntity<DTO.ItemResponse> createItem(
            @Valid @RequestBody DTO.CreateItemRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.validateToken(token);
            boolean isManager = user.canManageItems();

            if (isManager) {
                if (req.getAuthor() == null || req.getAuthor().isBlank()) {
                    req.setAuthor(user.getFullName());
                }
                logger.info("Manager: {} create item title: {}", user.getFullName(), req.getTitle());
                return ResponseEntity.status(HttpStatus.CREATED).body(service.createItem(req));
            } else {
                logger.info("User: {} suggest item title: {}", user.getFullName(), req.getTitle());
                return ResponseEntity.status(HttpStatus.CREATED).body(service.suggestItem(req, user.getFullName()));
            }
        } catch (Exception e) {
            logger.error("Create item failed - {}", e.getMessage());
            throw e;
        }
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<DTO.ItemResponse> updateItem(
            @PathVariable String id,
            @Valid @RequestBody DTO.CreateItemRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireManager(token);
            logger.info("Manager: {} update item id: {}", user.getFullName(), id);
            return ResponseEntity.ok(service.updateItem(id, req));
        } catch (Exception e) {
            logger.error("Update item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, String>> deleteItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireManager(token);
            logger.info("Manager: {} delete item id: {}", user.getFullName(), id);
            service.deleteItem(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài tri thức " + id));
        } catch (Exception e) {
            logger.error("Delete item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PutMapping("/items/{id}/publish")
    public ResponseEntity<DTO.ItemResponse> publishItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireManager(token);
            logger.info("Manager: {} publish item id: {}", user.getFullName(), id);
            return ResponseEntity.ok(service.publishItem(id));
        } catch (Exception e) {
            logger.error("Publish item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PutMapping("/items/{id}/archive")
    public ResponseEntity<DTO.ItemResponse> archiveItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireAdmin(token);
            logger.info("Admin: {} archive item id: {}", user.getFullName(), id);
            return ResponseEntity.ok(service.archiveItem(id));
        } catch (Exception e) {
            logger.error("Archive item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PutMapping("/items/{id}/accept")
    public ResponseEntity<DTO.ItemResponse> acceptItem(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireManager(token);
            logger.info("Manager: {} accept suggested item id: {}", user.getFullName(), id);
            return ResponseEntity.ok(service.acceptItem(id));
        } catch (Exception e) {
            logger.error("Accept item id: {} failed - {}", id, e.getMessage());
            throw e;
        }
    }

    @PutMapping("/items/bulk-archive")
    public ResponseEntity<Map<String, String>> bulkArchive(
            @Valid @RequestBody DTO.BulkArchiveRequest req,
            @RequestHeader("Authorization") String token) {
        try {
            JwtUser user = authService.requireAdmin(token);
            logger.info("Admin: {} bulk archive {} items", user.getFullName(), req.getIds().size());
            service.bulkArchive(req.getIds());
            return ResponseEntity.ok(Map.of("message", "Đã archive " + req.getIds().size() + " bài"));
        } catch (Exception e) {
            logger.error("Bulk archive failed - {}", e.getMessage());
            throw e;
        }
    }

    private void validateSort(String sort) {
        if (!VALID_SORT_VALUES.contains(sort)) {
            throw new ValidationException("Sort không hợp lệ. Chọn: updated, rating, title");
        }
    }
}
