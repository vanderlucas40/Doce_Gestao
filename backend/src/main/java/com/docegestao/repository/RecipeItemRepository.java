package com.docegestao.repository;

import com.docegestao.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {

    /** Todos os ingredientes da ficha técnica de um produto */
    @Query("""
        SELECT r FROM RecipeItem r
        JOIN FETCH r.ingredient
        WHERE r.product.id = :productId
        """)
    List<RecipeItem> findByProductId(@Param("productId") Long productId);

    /** Todos os itens de ficha técnica de uma lista de produtos (evita N+1) */
    @Query("""
        SELECT r FROM RecipeItem r
        JOIN FETCH r.ingredient
        JOIN FETCH r.product
        WHERE r.product.id IN :productIds
        """)
    List<RecipeItem> findByProductIds(@Param("productIds") List<Long> productIds);

    Optional<RecipeItem> findByProductIdAndIngredientId(Long productId, Long ingredientId);
}
