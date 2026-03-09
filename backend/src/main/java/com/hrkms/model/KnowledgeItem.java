package com.hrkms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "knowledge_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class KnowledgeItem {

    @Id
    @Column(length = 20)
    private String id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String type; // Policy, FAQ, Checklist

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "item_tags",
            joinColumns = @JoinColumn(name = "item_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags = new ArrayList<>();

    @Column(length = 100)
    private String audience;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "item_related", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "related_id")
    private List<String> relatedItems = new ArrayList<>();

    private String author;
    private String version;
    private LocalDate createdDate;
    private LocalDate updatedDate;

    @Column(length = 20)
    @Builder.Default
    private String status = "Draft"; // Draft, Published, Archived, Suggested

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer ratingCount = 0;

    @OneToMany(mappedBy = "knowledgeItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "suggested_by", length = 100)
    private String suggestedBy;
}
