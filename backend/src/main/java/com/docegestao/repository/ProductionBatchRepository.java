package com.docegestao.repository;

import com.docegestao.entity.ProductionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionBatchRepository extends JpaRepository<ProductionBatch, Long> {

    @Query("""
        SELECT b FROM ProductionBatch b
        JOIN FETCH b.store
        JOIN FETCH b.items i
        JOIN FETCH i.product
        LEFT JOIN FETCH b.ingredientUsages u
        LEFT JOIN FETCH u.ingredient
        WHERE b.store.id = :storeId
        ORDER BY b.producedAt DESC
        """)
    List<ProductionBatch> findByStoreIdWithDetails(@Param("storeId") Long storeId);

    @Query("""
        SELECT b FROM ProductionBatch b
        JOIN FETCH b.store
        JOIN FETCH b.items i
        JOIN FETCH i.product
        LEFT JOIN FETCH b.ingredientUsages u
        LEFT JOIN FETCH u.ingredient
        WHERE b.store.id = :storeId
        AND b.producedAt BETWEEN :start AND :end
        ORDER BY b.producedAt DESC
        """)
    List<ProductionBatch> findByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end);

    @Query("""
        SELECT b FROM ProductionBatch b
        JOIN FETCH b.store
        JOIN FETCH b.items i
        JOIN FETCH i.product
        LEFT JOIN FETCH b.ingredientUsages u
        LEFT JOIN FETCH u.ingredient
        WHERE b.id = :id
        """)
    Optional<ProductionBatch> findByIdWithDetails(@Param("id") Long id);
}
