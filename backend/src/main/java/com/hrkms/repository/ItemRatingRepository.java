package com.hrkms.repository;

import com.hrkms.model.ItemRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemRatingRepository extends JpaRepository<ItemRating, Long> {

    Optional<ItemRating> findByItemIdAndUsername(String itemId, String username);
}
