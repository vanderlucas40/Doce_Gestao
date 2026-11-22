package com.docegestao.repository;

import com.docegestao.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findByStoreId(Long storeId);

    Optional<Inventory> findByStoreIdAndProductId(Long storeId, Long productId);

    @Query("""
        SELECT i FROM Inventory i
        JOIN FETCH i.product
        WHERE i.store.id = :storeId
        AND i.quantity < (i.maxQuantity * 0.3)
        """)
    List<Inventory> findLowStockByStore(@Param("storeId") Long storeId);
}
