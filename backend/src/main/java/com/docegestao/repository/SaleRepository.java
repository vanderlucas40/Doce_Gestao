package com.docegestao.repository;

import com.docegestao.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("""
        SELECT s FROM Sale s
        JOIN FETCH s.items i
        JOIN FETCH i.product
        WHERE s.store.id = :storeId
        ORDER BY s.soldAt DESC
        """)
    List<Sale> findByStoreIdOrderBySoldAtDesc(@Param("storeId") Long storeId);

    /**
     * Paginação em duas etapas: primeiro só os IDs da página (o banco pagina com LIMIT),
     * depois as vendas com itens (JOIN FETCH). Paginar direto com JOIN FETCH de coleção
     * faria o Hibernate carregar tudo e paginar em memória.
     */
    @Query(value = """
        SELECT s.id FROM Sale s
        WHERE s.store.id = :storeId
        ORDER BY s.soldAt DESC, s.id DESC
        """,
        countQuery = "SELECT COUNT(s) FROM Sale s WHERE s.store.id = :storeId")
    Page<Long> findIdsByStoreId(@Param("storeId") Long storeId, Pageable pageable);

    @Query("""
        SELECT s FROM Sale s
        JOIN FETCH s.store
        JOIN FETCH s.items i
        JOIN FETCH i.product
        WHERE s.id IN :ids
        """)
    List<Sale> findWithItemsByIdIn(@Param("ids") Collection<Long> ids);

    @Query("""
        SELECT s FROM Sale s
        JOIN FETCH s.items i
        JOIN FETCH i.product
        WHERE s.store.id = :storeId
        AND s.soldAt BETWEEN :start AND :end
        ORDER BY s.soldAt DESC
        """)
    List<Sale> findByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end);

    @Query("""
        SELECT COALESCE(SUM(s.total), 0)
        FROM Sale s
        WHERE s.store.id = :storeId
        AND s.soldAt BETWEEN :start AND :end
        """)
    BigDecimal sumTotalByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end);

    @Query("""
        SELECT COUNT(s) FROM Sale s
        WHERE s.store.id = :storeId
        AND s.soldAt BETWEEN :start AND :end
        """)
    long countByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start")   LocalDateTime start,
            @Param("end")     LocalDateTime end);
}
