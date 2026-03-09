package com.hrkms.repository;

import com.hrkms.model.KnowledgeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface KnowledgeItemRepository extends JpaRepository<KnowledgeItem, String> {

    List<KnowledgeItem> findByType(String type);

    List<KnowledgeItem> findByStatus(String status);

    @Query("SELECT k FROM KnowledgeItem k WHERE " +
           "LOWER(k.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(k.content) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(k.id) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<KnowledgeItem> searchByQuery(@Param("query") String query);

    List<KnowledgeItem> findAllByOrderByUpdatedDateDesc();
    List<KnowledgeItem> findAllByOrderByRatingDesc();
    List<KnowledgeItem> findAllByOrderByTitleAsc();

    List<KnowledgeItem> findByUpdatedDateBefore(LocalDate cutoff);
}
