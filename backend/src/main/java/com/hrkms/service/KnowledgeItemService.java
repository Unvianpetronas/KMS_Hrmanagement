package com.hrkms.service;

import com.hrkms.dto.DTO;
import com.hrkms.exception.ResourceNotFoundException;
import com.hrkms.exception.ValidationException;
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
    private final TagRepository tagRepo;

    private static final int STALE_MONTHS_DEFAULT = 12;

    // === CRUD ===

    public List<DTO.ItemResponse> getAllItems(String sortBy) {
        List<KnowledgeItem> items = switch (sortBy) {
            case "rating" -> itemRepo.findAllByOrderByRatingDesc();
            case "title" -> itemRepo.findAllByOrderByTitleAsc();
            default -> itemRepo.findAllByOrderByUpdatedDateDesc();
        };
        return items.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DTO.ItemResponse getById(String id) {
        return itemRepo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài: " + id));
    }

    @Transactional
    public DTO.ItemResponse createItem(DTO.CreateItemRequest req) {
        List<Tag> tags = resolveTags(req.getTags());
        String id = generateId(req.getType());
        KnowledgeItem item = KnowledgeItem.builder()
                .id(id).title(req.getTitle()).type(req.getType())
                .tags(tags)
                .audience(req.getAudience()).content(req.getContent())
                .relatedItems(req.getRelatedItems() != null ? req.getRelatedItems() : new ArrayList<>())
                .author(req.getAuthor() != null && !req.getAuthor().isBlank() ? req.getAuthor() : "System")
                .version("1.0").createdDate(LocalDate.now()).updatedDate(LocalDate.now())
                .status("Draft").rating(0.0).ratingCount(0).viewCount(0)
                .build();
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public DTO.ItemResponse suggestItem(DTO.CreateItemRequest req, String suggestedBy) {
        List<Tag> tags = resolveTags(req.getTags());
        String id = generateId(req.getType());
        KnowledgeItem item = KnowledgeItem.builder()
                .id(id).title(req.getTitle()).type(req.getType())
                .tags(tags)
                .audience(req.getAudience()).content(req.getContent())
                .relatedItems(req.getRelatedItems() != null ? req.getRelatedItems() : new ArrayList<>())
                .author(req.getAuthor() != null && !req.getAuthor().isBlank() ? req.getAuthor() : suggestedBy)
                .version("1.0").createdDate(LocalDate.now()).updatedDate(LocalDate.now())
                .status("Suggested").rating(0.0).ratingCount(0).viewCount(0)
                .suggestedBy(suggestedBy)
                .build();
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public DTO.ItemResponse updateItem(String id, DTO.CreateItemRequest req) {
        List<Tag> tags = resolveTags(req.getTags());
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + id));
        item.setTitle(req.getTitle());
        item.setContent(req.getContent());
        item.setTags(tags);
        item.setAudience(req.getAudience());
        item.setUpdatedDate(LocalDate.now());
        item.setVersion(incrementVersion(item.getVersion()));
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public void deleteItem(String id) {
        if (!itemRepo.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy bài: " + id);
        }
        itemRepo.deleteById(id);
    }

    // === PUBLISH / ARCHIVE / ACCEPT ===

    @Transactional
    public DTO.ItemResponse publishItem(String id) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + id));
        item.setStatus("Published");
        item.setUpdatedDate(LocalDate.now());
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public DTO.ItemResponse archiveItem(String id) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + id));
        item.setStatus("Archived");
        item.setUpdatedDate(LocalDate.now());
        return toResponse(itemRepo.save(item));
    }

    @Transactional
    public DTO.ItemResponse acceptItem(String id) {
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + id));
        if (!"Suggested".equals(item.getStatus())) {
            throw new ValidationException("Bài này không ở trạng thái Suggested");
        }
        item.setStatus("Draft");
        item.setUpdatedDate(LocalDate.now());
        return toResponse(itemRepo.save(item));
    }

    // === VIEW TRACKING ===

    @Transactional
    public void recordView(String id) {
        itemRepo.findById(id).ifPresent(item -> {
            item.setViewCount(item.getViewCount() == null ? 1 : item.getViewCount() + 1);
            itemRepo.save(item);
        });
    }

    // === STALE ITEMS ===

    public List<DTO.ItemResponse> getStaleItems(int months) {
        LocalDate cutoff = LocalDate.now().minusMonths(months);
        return itemRepo.findByUpdatedDateBefore(cutoff).stream()
                .filter(i -> !"Archived".equals(i.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // === BULK ARCHIVE ===

    @Transactional
    public void bulkArchive(List<String> ids) {
        for (String id : ids) {
            itemRepo.findById(id).ifPresent(item -> {
                item.setStatus("Archived");
                item.setUpdatedDate(LocalDate.now());
                itemRepo.save(item);
            });
        }
    }

    // === SEARCH & FILTER ===

    public List<DTO.ItemResponse> search(String query, String type, List<String> tags, String sortBy) {
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
            results.removeIf(item -> tags.stream().noneMatch(
                tagName -> item.getTags().stream().anyMatch(t -> t.getName().equals(tagName))
            ));
        }
        List<KnowledgeItem> sorted = new ArrayList<>(results);
        if ("rating".equals(sortBy)) sorted.sort(Comparator.comparingDouble(KnowledgeItem::getRating).reversed());
        else if ("title".equals(sortBy)) sorted.sort(Comparator.comparing(KnowledgeItem::getTitle));
        else sorted.sort(Comparator.comparing(KnowledgeItem::getUpdatedDate).reversed());
        return sorted.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // === RATING ===

    @Transactional
    public DTO.ItemResponse rateItem(String id, int stars) {
        if (stars < 1 || stars > 5) throw new ValidationException("Rating phải từ 1-5");
        KnowledgeItem item = itemRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + id));
        double totalRating = item.getRating() * item.getRatingCount() + stars;
        item.setRatingCount(item.getRatingCount() + 1);
        item.setRating(Math.round(totalRating / item.getRatingCount() * 10.0) / 10.0);
        return toResponse(itemRepo.save(item));
    }

    // === COMMENTS ===

    @Transactional
    public DTO.ItemResponse addComment(String itemId, DTO.CommentRequest req) {
        KnowledgeItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy: " + itemId));
        Comment comment = Comment.builder()
                .userName(req.getUserName()).text(req.getText())
                .createdDate(LocalDate.now()).knowledgeItem(item).build();
        item.getComments().add(comment);
        return toResponse(itemRepo.save(item));
    }

    // === STATS ===

    public Map<String, Object> getStats() {
        List<KnowledgeItem> all = itemRepo.findAll();
        LocalDate staleCutoff = LocalDate.now().minusMonths(STALE_MONTHS_DEFAULT);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", all.size());
        stats.put("policy", all.stream().filter(i -> "Policy".equals(i.getType())).count());
        stats.put("faq", all.stream().filter(i -> "FAQ".equals(i.getType())).count());
        stats.put("checklist", all.stream().filter(i -> "Checklist".equals(i.getType())).count());
        stats.put("lesson", all.stream().filter(i -> "Lesson".equals(i.getType())).count());
        stats.put("published", all.stream().filter(i -> "Published".equals(i.getStatus())).count());
        stats.put("draft", all.stream().filter(i -> "Draft".equals(i.getStatus())).count());
        stats.put("archived", all.stream().filter(i -> "Archived".equals(i.getStatus())).count());
        stats.put("suggested", all.stream().filter(i -> "Suggested".equals(i.getStatus())).count());
        stats.put("avgRating", all.stream().mapToDouble(KnowledgeItem::getRating).average().orElse(0));
        stats.put("staleCount", all.stream()
                .filter(i -> !"Archived".equals(i.getStatus()) && i.getUpdatedDate() != null && i.getUpdatedDate().isBefore(staleCutoff))
                .count());

        List<Map<String, Object>> topRated = itemRepo.findAllByOrderByRatingDesc().stream()
                .limit(5)
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", i.getId());
                    m.put("title", i.getTitle().length() > 30 ? i.getTitle().substring(0, 30) + "…" : i.getTitle());
                    m.put("rating", i.getRating());
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("topRated", topRated);

        List<Map<String, Object>> recentlyUpdated = itemRepo.findAllByOrderByUpdatedDateDesc().stream()
                .limit(5)
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", i.getId());
                    m.put("title", i.getTitle().length() > 35 ? i.getTitle().substring(0, 35) + "…" : i.getTitle());
                    m.put("type", i.getType());
                    m.put("updatedDate", i.getUpdatedDate());
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("recentlyUpdated", recentlyUpdated);

        return stats;
    }



    private List<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null) return new ArrayList<>();
        return tagNames.stream()
                .map(name -> tagRepo.findByName(name)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag '" + name + "' không tồn tại")))
                .collect(Collectors.toList());
    }

    private String generateId(String type) {
        String prefix = switch (type) {
            case "FAQ" -> "FAQ";
            case "Checklist" -> "CHK";
            case "Lesson" -> "LES";
            default -> "POL";
        };
        long count = itemRepo.findByType(type).size();
        String id = String.format("%s-%03d", prefix, count + 1);
        while (itemRepo.existsById(id)) {
            count++;
            id = String.format("%s-%03d", prefix, count + 1);
        }
        return id;
    }

    private String incrementVersion(String version) {
        String[] parts = version != null ? version.split("\\.") : new String[]{"1", "0"};
        try {
            int major = Integer.parseInt(parts[0]);
            int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            return major + "." + (minor + 1);
        } catch (NumberFormatException e) {
            return version + ".1";
        }
    }

    // === MAPPER ===

    private DTO.ItemResponse toResponse(KnowledgeItem item) {
        List<String> tagNames = item.getTags().stream().map(Tag::getName).collect(Collectors.toList());
        List<DTO.CommentResponse> comments = item.getComments().stream()
                .map(c -> new DTO.CommentResponse(c.getId(), c.getUserName(), c.getText(), c.getCreatedDate()))
                .collect(Collectors.toList());
        boolean isStale = item.getUpdatedDate() != null
                && item.getUpdatedDate().isBefore(LocalDate.now().minusMonths(STALE_MONTHS_DEFAULT));
        return new DTO.ItemResponse(
                item.getId(), item.getTitle(), item.getType(), tagNames,
                item.getAudience(), item.getContent(), item.getRelatedItems(),
                item.getAuthor(), item.getVersion(), item.getCreatedDate(), item.getUpdatedDate(),
                item.getStatus(), item.getRating(), item.getRatingCount(), comments,
                item.getViewCount() != null ? item.getViewCount() : 0,
                isStale,
                item.getSuggestedBy()
        );
    }
}
