package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BatchItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BatchIngredientUsage> ingredientUsages = new ArrayList<>();

    public enum BatchStatus { PLANNED, IN_PROGRESS, COMPLETED, CANCELLED }
}
