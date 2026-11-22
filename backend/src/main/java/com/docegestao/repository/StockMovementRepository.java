package com.docegestao.repository;

import com.docegestao.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @EntityGraph(attributePaths = {"product", "ingredient", "user"})
    Page<StockMovement> findByStoreIdOrderByCreatedAtDescIdDesc(Long storeId, Pageable pageable);
}
