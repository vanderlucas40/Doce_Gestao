package com.docegestao.repository;

import com.docegestao.entity.IngredientStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientStockRepository extends JpaRepository<IngredientStock, Long> {

    List<IngredientStock> findByStoreId(Long storeId);

    Optional<IngredientStock> findByStoreIdAndIngredientId(Long storeId, Long ingredientId);

    @Query("""
        SELECT s FROM IngredientStock s
        JOIN FETCH s.ingredient
        WHERE s.store.id = :storeId
        AND s.quantity < s.ingredient.minQuantity
        """)
    List<IngredientStock> findLowStockByStore(@Param("storeId") Long storeId);
}
