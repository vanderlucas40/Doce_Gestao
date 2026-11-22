package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Cabeçalho de uma Fornada (lote de produção).
 * Agrupa os sabores produzidos e o consumo real de insumos.
 */
@Entity
@Table(name = "production_batches")
@Getter @Setter @NoArgsConstructor
public class ProductionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BatchStatus status = BatchStatus.COMPLETED;

    private String notes;

    @Column(name = "produced_at", nullable = false)
    private LocalDateTime producedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "total_items", nullable = false)
    private Integer totalItems = 0;

    // Set (e não List): o histórico busca items e ingredientUsages com JOIN FETCH na
    // mesma consulta, e o Hibernate não aceita duas "bags" (MultipleBagFetchException);
    // com List, o produto cartesiano também duplicaria os itens (DEF-07)
    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BatchItem> items = new LinkedHashSet<>();

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BatchIngredientUsage> ingredientUsages = new LinkedHashSet<>();

    public enum BatchStatus { PLANNED, IN_PROGRESS, COMPLETED, CANCELLED }
}
