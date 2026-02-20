package com.hrkms.service;

import com.hrkms.dto.DTO;
import com.hrkms.model.*;
import com.hrkms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeItemService {

    private final KnowledgeItemRepository itemRepo;

    // === CRUD ===

    public List<com.hrkms.dto.DTO.ItemResponse> getAllItems(String sortBy) {
        List<KnowledgeItem> items;
        if ("rating".equals(sortBy)) items = itemRepo.findAllByOrderByRatingDesc();
        else if ("title".equals(sortBy)) items = itemRepo.findAllByOrderByTitleAsc();
        else items = itemRepo.findAllByOrderByUpdatedDateDesc();
        return items.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public com.hrkms.dto.DTO.ItemResponse getById(String id) {
        return itemRepo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài: " + id));
    }

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse createItem(com.hrkms.dto.DTO.CreateItemRequest req) {
        String prefix = switch (req.getType()) {
            case "FAQ" -> "FAQ";
            case "Checklist" -> "CHK";
            default -> "POL";
        };
        long count = itemRepo.findByType(req.getType()).size();
        String id = String.format("%s-%03d", prefix, count + 1);
        while (itemRepo.existsById(id)) {
            count++;
            id = String.format("%s-%03d", prefix, count + 1);
        }

        KnowledgeItem item = KnowledgeItem.builder()
                .id(id).title(req.getTitle()).type(req.getType())
                .tags(req.getTags() != null ? req.getTags() : new ArrayList<>())
                .audience(req.getAudience()).content(req.getContent())
                .relatedItems(req.getRelatedItems() != null ? req.getRelatedItems() : new ArrayList<>())
                .author(req.getAuthor() != null ? req.getAuthor() : "System")
                .version("1.0").createdDate(LocalDate.now()).updatedDate(LocalDate.now())
                .status("Draft").rating(0.0).ratingCount(0)
                .build();
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse updateItem(String id, com.hrkms.dto.DTO.CreateItemRequest req) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy: " + id));
        item.setTitle(req.getTitle());
        item.setContent(req.getContent());
        item.setTags(req.getTags());
        item.setAudience(req.getAudience());
        item.setUpdatedDate(LocalDate.now());
        // Auto-increment minor version
        String[] ver = item.getVersion().split("\\.");
        item.setVersion(ver[0] + "." + (Integer.parseInt(ver[1]) + 1));
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public void deleteItem(String id) {
        if (!itemRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bài: " + id);
        }
        itemRepo.deleteById(id);
    }

    // === PUBLISH / ARCHIVE (Manager/Admin) ===

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse publishItem(String id) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy: " + id));
        item.setStatus("Published");
        item.setUpdatedDate(LocalDate.now());
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse archiveItem(String id) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy: " + id));
        item.setStatus("Archived");
        item.setUpdatedDate(LocalDate.now());
        return toResponse(itemRepo.save(item));
    }

    // === SEARCH & FILTER ===

    public List<com.hrkms.dto.DTO.ItemResponse> search(String query, String type, List<String> tags, String sortBy) {
        Set<KnowledgeItem> results = new LinkedHashSet<>();
        if (query != null && !query.isBlank()) {
            results.addAll(itemRepo.searchByQuery(query));
        } else {
            results.addAll(itemRepo.findAll());
        }
        if (type != null && !type.isBlank() && !"All".equals(type)) {
            results.removeIf(item -> !item.getType().equals(type));
        }
        if (tags != null && !tags.isEmpty()) {
            results.removeIf(item -> tags.stream().noneMatch(item.getTags()::contains));
        }
        List<KnowledgeItem> sorted = new ArrayList<>(results);
        if ("rating".equals(sortBy)) sorted.sort(Comparator.comparingDouble(KnowledgeItem::getRating).reversed());
        else if ("title".equals(sortBy)) sorted.sort(Comparator.comparing(KnowledgeItem::getTitle));
        else sorted.sort(Comparator.comparing(KnowledgeItem::getUpdatedDate).reversed());
        return sorted.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // === RATING ===

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse rateItem(String id, int stars) {
        if (stars < 1 || stars > 5) throw new RuntimeException("Rating phải từ 1-5");
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy: " + id));
        double totalRating = item.getRating() * item.getRatingCount() + stars;
        item.setRatingCount(item.getRatingCount() + 1);
        item.setRating(Math.round(totalRating / item.getRatingCount() * 10.0) / 10.0);
        return toResponse(itemRepo.save(item));
    }

    // === COMMENTS ===

    @Transactional
    public com.hrkms.dto.DTO.ItemResponse addComment(String itemId, com.hrkms.dto.DTO.CommentRequest req) {
        KnowledgeItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy: " + itemId));
        Comment comment = Comment.builder()
                .userName(req.getUserName()).text(req.getText())
                .createdDate(LocalDate.now()).knowledgeItem(item).build();
        item.getComments().add(comment);
        return toResponse(itemRepo.save(item));
    }

    // === STATS ===

    public Map<String, Object> getStats() {
        List<KnowledgeItem> all = itemRepo.findAll();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", all.size());
        stats.put("policy", all.stream().filter(i -> "Policy".equals(i.getType())).count());
        stats.put("faq", all.stream().filter(i -> "FAQ".equals(i.getType())).count());
        stats.put("checklist", all.stream().filter(i -> "Checklist".equals(i.getType())).count());
        stats.put("published", all.stream().filter(i -> "Published".equals(i.getStatus())).count());
        stats.put("draft", all.stream().filter(i -> "Draft".equals(i.getStatus())).count());
        stats.put("archived", all.stream().filter(i -> "Archived".equals(i.getStatus())).count());
        stats.put("avgRating", all.stream().mapToDouble(KnowledgeItem::getRating).average().orElse(0));
        return stats;
    }

    // === MAPPER ===

    private com.hrkms.dto.DTO.ItemResponse toResponse(KnowledgeItem item) {
        List<com.hrkms.dto.DTO.CommentResponse> comments = item.getComments().stream()
                .map(c -> new com.hrkms.dto.DTO.CommentResponse(c.getId(), c.getUserName(), c.getText(), c.getCreatedDate()))
                .collect(Collectors.toList());
        return new DTO.ItemResponse(
                item.getId(), item.getTitle(), item.getType(), item.getTags(),
                item.getAudience(), item.getContent(), item.getRelatedItems(),
                item.getAuthor(), item.getVersion(), item.getCreatedDate(), item.getUpdatedDate(),
                item.getStatus(), item.getRating(), item.getRatingCount(), comments
        );
    }
}
