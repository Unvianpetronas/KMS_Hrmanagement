package com.hrkms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "item_ratings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"item_id", "username"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false, length = 20)
    private String itemId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private Integer stars;

    @Builder.Default
    private LocalDate ratedDate = LocalDate.now();
}
